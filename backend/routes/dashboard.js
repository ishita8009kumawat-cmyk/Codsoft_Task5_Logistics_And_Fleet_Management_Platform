const express = require("express");
const db = require("../db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

router.get("/admin", authorize("admin"), (req, res) => {
  const activeShipments = db
    .prepare("SELECT COUNT(*) c FROM shipments WHERE status NOT IN ('delivered','cancelled')")
    .get().c;
  const pendingAssignment = db.prepare("SELECT COUNT(*) c FROM shipments WHERE status = 'pending'").get().c;
  const deliveredToday = db
    .prepare("SELECT COUNT(*) c FROM shipments WHERE status = 'delivered' AND date(delivered_at) = date('now')")
    .get().c;
  const totalVehicles = db.prepare("SELECT COUNT(*) c FROM vehicles").get().c;
  const availableVehicles = db.prepare("SELECT COUNT(*) c FROM vehicles WHERE status = 'available'").get().c;
  const availableDrivers = db.prepare("SELECT COUNT(*) c FROM driver_profiles WHERE status = 'available'").get().c;
  const totalDrivers = db.prepare("SELECT COUNT(*) c FROM driver_profiles").get().c;
  const warehouseCount = db.prepare("SELECT COUNT(*) c FROM warehouses").get().c;

  const byStatus = db.prepare("SELECT status, COUNT(*) c FROM shipments GROUP BY status").all();
  const statusMap = { pending: 0, assigned: 0, picked_up: 0, in_transit: 0, delivered: 0, cancelled: 0 };
  byStatus.forEach((r) => (statusMap[r.status] = r.c));

  res.json({
    activeShipments,
    pendingAssignment,
    deliveredToday,
    totalVehicles,
    availableVehicles,
    availableDrivers,
    totalDrivers,
    warehouseCount,
    statusMap,
  });
});

router.get("/driver", authorize("driver"), (req, res) => {
  const activeShipments = db
    .prepare("SELECT COUNT(*) c FROM shipments WHERE driver_id = ? AND status NOT IN ('delivered','cancelled')")
    .get(req.user.id).c;
  const deliveredTotal = db
    .prepare("SELECT COUNT(*) c FROM shipments WHERE driver_id = ? AND status = 'delivered'")
    .get(req.user.id).c;
  const deliveredToday = db
    .prepare("SELECT COUNT(*) c FROM shipments WHERE driver_id = ? AND status = 'delivered' AND date(delivered_at) = date('now')")
    .get(req.user.id).c;

  res.json({ activeShipments, deliveredTotal, deliveredToday });
});

router.get("/customer", authorize("customer"), (req, res) => {
  const activeShipments = db
    .prepare("SELECT COUNT(*) c FROM shipments WHERE customer_id = ? AND status NOT IN ('delivered','cancelled')")
    .get(req.user.id).c;
  const totalShipments = db.prepare("SELECT COUNT(*) c FROM shipments WHERE customer_id = ?").get(req.user.id).c;
  const deliveredShipments = db
    .prepare("SELECT COUNT(*) c FROM shipments WHERE customer_id = ? AND status = 'delivered'")
    .get(req.user.id).c;

  res.json({ activeShipments, totalShipments, deliveredShipments });
});

module.exports = router;
