const express = require("express");
const db = require("../db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

const STATUS_FLOW = ["pending", "assigned", "picked_up", "in_transit", "delivered", "cancelled"];

function serializeShipment(shipment) {
  const events = db
    .prepare("SELECT id, status, note, created_at FROM tracking_events WHERE shipment_id = ? ORDER BY created_at")
    .all(shipment.id);
  return { ...shipment, events };
}

// Admin: all shipments
router.get("/", authorize("admin"), (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT s.*, c.name as customer_name, d.name as driver_name, v.plate_no, w.name as warehouse_name
    FROM shipments s
    JOIN users c ON c.id = s.customer_id
    LEFT JOIN users d ON d.id = s.driver_id
    LEFT JOIN vehicles v ON v.id = s.vehicle_id
    LEFT JOIN warehouses w ON w.id = s.warehouse_id
  `;
  const params = [];
  if (status) {
    sql += " WHERE s.status = ?";
    params.push(status);
  }
  sql += " ORDER BY s.created_at DESC";
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(serializeShipment));
});

// Customer: own shipments
router.get("/mine", authorize("customer"), (req, res) => {
  const rows = db
    .prepare(
      `SELECT s.*, d.name as driver_name, v.plate_no, w.name as warehouse_name
       FROM shipments s
       LEFT JOIN users d ON d.id = s.driver_id
       LEFT JOIN vehicles v ON v.id = s.vehicle_id
       LEFT JOIN warehouses w ON w.id = s.warehouse_id
       WHERE s.customer_id = ? ORDER BY s.created_at DESC`
    )
    .all(req.user.id);
  res.json(rows.map(serializeShipment));
});

// Driver: assigned shipments (active + recent history)
router.get("/assigned", authorize("driver"), (req, res) => {
  const rows = db
    .prepare(
      `SELECT s.*, c.name as customer_name, c.phone as customer_phone, w.name as warehouse_name, w.address as warehouse_address
       FROM shipments s
       JOIN users c ON c.id = s.customer_id
       LEFT JOIN warehouses w ON w.id = s.warehouse_id
       WHERE s.driver_id = ? ORDER BY s.created_at DESC`
    )
    .all(req.user.id);
  res.json(rows.map(serializeShipment));
});

// Single shipment (owner customer, assigned driver, or admin)
router.get("/:id", (req, res) => {
  const shipment = db
    .prepare(
      `SELECT s.*, c.name as customer_name, d.name as driver_name, v.plate_no, w.name as warehouse_name, w.address as warehouse_address
       FROM shipments s
       JOIN users c ON c.id = s.customer_id
       LEFT JOIN users d ON d.id = s.driver_id
       LEFT JOIN vehicles v ON v.id = s.vehicle_id
       LEFT JOIN warehouses w ON w.id = s.warehouse_id
       WHERE s.id = ?`
    )
    .get(req.params.id);
  if (!shipment) return res.status(404).json({ error: "Shipment not found" });

  if (req.user.role === "customer" && shipment.customer_id !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (req.user.role === "driver" && shipment.driver_id !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  res.json(serializeShipment(shipment));
});

// Customer: book a new shipment
router.post("/", authorize("customer"), (req, res) => {
  const { warehouse_id, destination_address, description, weight_kg } = req.body;
  if (!warehouse_id || !destination_address) {
    return res.status(400).json({ error: "warehouse_id and destination_address are required" });
  }

  const tx = db.transaction(() => {
    const id = db
      .prepare(
        `INSERT INTO shipments (customer_id, warehouse_id, destination_address, description, weight_kg, status)
         VALUES (?,?,?,?,?, 'pending')`
      )
      .run(req.user.id, warehouse_id, destination_address, description || null, Number(weight_kg) || 1).lastInsertRowid;

    db.prepare("INSERT INTO tracking_events (shipment_id, status, note) VALUES (?, 'pending', ?)").run(
      id,
      "Shipment booked by customer, awaiting assignment."
    );
    return id;
  });

  const id = tx();
  res.status(201).json({ id, message: "Shipment booked" });
});

// Admin: assign a driver + vehicle to a pending/assigned shipment
router.put("/:id/assign", authorize("admin"), (req, res) => {
  const { driver_id, vehicle_id } = req.body;
  if (!driver_id) return res.status(400).json({ error: "driver_id is required" });

  const shipment = db.prepare("SELECT * FROM shipments WHERE id = ?").get(req.params.id);
  if (!shipment) return res.status(404).json({ error: "Shipment not found" });

  const driver = db.prepare("SELECT u.name FROM users u WHERE u.id = ? AND u.role = 'driver'").get(driver_id);
  if (!driver) return res.status(400).json({ error: "Driver not found" });

  const tx = db.transaction(() => {
    db.prepare("UPDATE shipments SET status = 'assigned', driver_id = ?, vehicle_id = ? WHERE id = ?").run(
      driver_id,
      vehicle_id || null,
      req.params.id
    );
    const vehicleNote = vehicle_id
      ? db.prepare("SELECT plate_no FROM vehicles WHERE id = ?").get(vehicle_id)?.plate_no
      : null;
    db.prepare("INSERT INTO tracking_events (shipment_id, status, note) VALUES (?, 'assigned', ?)").run(
      req.params.id,
      `Assigned to ${driver.name}${vehicleNote ? ` (${vehicleNote})` : ""}.`
    );
  });

  tx();
  res.json({ message: "Shipment assigned" });
});

// Driver: update status of own assigned shipment (or admin, for oversight)
router.put("/:id/status", authorize("driver", "admin"), (req, res) => {
  const { status, note } = req.body;
  if (!STATUS_FLOW.includes(status)) return res.status(400).json({ error: "Invalid status" });

  const shipment = db.prepare("SELECT * FROM shipments WHERE id = ?").get(req.params.id);
  if (!shipment) return res.status(404).json({ error: "Shipment not found" });
  if (req.user.role === "driver" && shipment.driver_id !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const tx = db.transaction(() => {
    const deliveredAt = status === "delivered" ? new Date().toISOString().slice(0, 19).replace("T", " ") : shipment.delivered_at;
    db.prepare("UPDATE shipments SET status = ?, delivered_at = ? WHERE id = ?").run(status, deliveredAt, req.params.id);

    const defaultNotes = {
      picked_up: "Picked up from warehouse.",
      in_transit: "En route to destination.",
      delivered: "Delivered successfully.",
      cancelled: "Shipment cancelled.",
    };
    db.prepare("INSERT INTO tracking_events (shipment_id, status, note) VALUES (?,?,?)").run(
      req.params.id,
      status,
      note || defaultNotes[status] || `Status changed to ${status}.`
    );
  });

  tx();
  res.json({ message: `Shipment marked as ${status}` });
});

module.exports = router;
