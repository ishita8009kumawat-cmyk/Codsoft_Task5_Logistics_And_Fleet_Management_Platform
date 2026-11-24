const express = require("express");
const db = require("../db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

// Admin: full driver roster
router.get("/", authorize("admin"), (req, res) => {
  const rows = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.phone, dp.license_no, dp.status,
              v.plate_no, v.type as vehicle_type,
              (SELECT COUNT(*) FROM shipments s WHERE s.driver_id = u.id AND s.status NOT IN ('delivered','cancelled')) as active_shipments
       FROM users u
       JOIN driver_profiles dp ON dp.user_id = u.id
       LEFT JOIN vehicles v ON v.driver_id = u.id
       WHERE u.role = 'driver'
       ORDER BY u.name`
    )
    .all();
  res.json(rows);
});

// Driver: own profile
router.get("/me", authorize("driver"), (req, res) => {
  const profile = db.prepare("SELECT * FROM driver_profiles WHERE user_id = ?").get(req.user.id);
  if (!profile) return res.status(404).json({ error: "Driver profile not found" });
  const vehicle = db.prepare("SELECT * FROM vehicles WHERE driver_id = ?").get(req.user.id);
  res.json({ ...profile, vehicle: vehicle || null });
});

// Driver: update own availability status
router.put("/me/status", authorize("driver"), (req, res) => {
  const { status } = req.body;
  if (!["available", "on_delivery", "off_duty"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  db.prepare("UPDATE driver_profiles SET status = ? WHERE user_id = ?").run(status, req.user.id);
  res.json({ message: `Status updated to ${status}` });
});

module.exports = router;
