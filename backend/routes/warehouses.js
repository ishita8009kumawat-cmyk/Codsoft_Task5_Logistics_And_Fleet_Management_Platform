const express = require("express");
const db = require("../db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

router.get("/", (req, res) => {
  const rows = db
    .prepare(
      `SELECT w.*, (SELECT COUNT(*) FROM shipments s WHERE s.warehouse_id = w.id AND s.status NOT IN ('delivered','cancelled')) as active_shipments
       FROM warehouses w ORDER BY w.name`
    )
    .all();
  res.json(rows);
});

router.post("/", authorize("admin"), (req, res) => {
  const { name, address, city } = req.body;
  if (!name || !address || !city) return res.status(400).json({ error: "name, address and city are required" });
  const id = db.prepare("INSERT INTO warehouses (name, address, city) VALUES (?,?,?)").run(name, address, city).lastInsertRowid;
  res.status(201).json({ id, message: "Warehouse added" });
});

router.put("/:id", authorize("admin"), (req, res) => {
  const wh = db.prepare("SELECT * FROM warehouses WHERE id = ?").get(req.params.id);
  if (!wh) return res.status(404).json({ error: "Warehouse not found" });
  const { name, address, city } = req.body;
  db.prepare(
    "UPDATE warehouses SET name = COALESCE(?, name), address = COALESCE(?, address), city = COALESCE(?, city) WHERE id = ?"
  ).run(name ?? null, address ?? null, city ?? null, req.params.id);
  res.json({ message: "Warehouse updated" });
});

router.delete("/:id", authorize("admin"), (req, res) => {
  db.prepare("DELETE FROM warehouses WHERE id = ?").run(req.params.id);
  res.json({ message: "Warehouse deleted" });
});

module.exports = router;
