require("dotenv").config();
const express = require("express");
const cors = require("cors");

require("./db"); // initializes + seeds sqlite db on first run

const authRoutes = require("./routes/auth");
const vehicleRoutes = require("./routes/vehicles");
const warehouseRoutes = require("./routes/warehouses");
const driverRoutes = require("./routes/drivers");
const shipmentRoutes = require("./routes/shipments");
const dashboardRoutes = require("./routes/dashboard");

const app = express();
const PORT = process.env.PORT || 5004;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "FleetFlow API" }));

app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`FleetFlow API running on http://localhost:${PORT}`);
});
