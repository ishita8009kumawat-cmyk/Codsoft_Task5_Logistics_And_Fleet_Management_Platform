const express = require("express");
const db = require("../db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

router.get("/", authorize("admin", "driver"), (req, res) => {
  const rows = db
    .prepare(
      `SELECT v.*, u.name as driver_name FROM vehicles v LEFT JOIN users u ON u.id = v.driver_id ORDER BY v.plate_no`
    )
    .all();
  res.json(rows);
});

router.post("/", authorize("admin"), (req, res) => {
  const { plate_no, type, capacity_kg, driver_id } = req.body;
  if (!plate_no) return res.status(400).json({ error: "plate_no is required" });
  try {
    const id = db
      .prepare("INSERT INTO vehicles (plate_no, type, capacity_kg, driver_id) VALUES (?,?,?,?)")
      .run(plate_no, type || "van", capacity_kg || 500, driver_id || null).lastInsertRowid;
    res.status(201).json({ id, message: "Vehicle added" });
  } catch (err) {
    res.status(400).json({ error: "That plate number is already registered" });
  }
});

router.put("/:id", authorize("admin"), (req, res) => {
  const vehicle = db.prepare("SELECT * FROM vehicles WHERE id = ?").get(req.params.id);
  if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
  const { plate_no, type, capacity_kg, status, driver_id } = req.body;
  db.prepare(
    `UPDATE vehicles SET
      plate_no = COALESCE(?, plate_no), type = COALESCE(?, type), capacity_kg = COALESCE(?, capacity_kg),
      status = COALESCE(?, status), driver_id = ?
     WHERE id = ?`
  ).run(
    plate_no ?? null,
    type ?? null,
    capacity_kg ?? null,
    status ?? null,
    driver_id !== undefined ? driver_id : vehicle.driver_id,
    req.params.id
  );
  res.json({ message: "Vehicle updated" });
});

router.delete("/:id", authorize("admin"), (req, res) => {
  db.prepare("DELETE FROM vehicles WHERE id = ?").run(req.params.id);
  res.json({ message: "Vehicle deleted" });
});

module.exports = router;
