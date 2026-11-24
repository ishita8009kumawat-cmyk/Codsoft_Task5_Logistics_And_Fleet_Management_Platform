const path = require("path");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "fleetflow.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ---------- SCHEMA ----------
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','driver','customer')),
  phone TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS driver_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  license_no TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available','on_delivery','off_duty'))
);

CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plate_no TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'van' CHECK(type IN ('bike','van','truck')),
  capacity_kg INTEGER NOT NULL DEFAULT 500,
  status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available','in_transit','maintenance')),
  driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS warehouses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shipments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  warehouse_id INTEGER REFERENCES warehouses(id),
  destination_address TEXT NOT NULL,
  description TEXT,
  weight_kg REAL NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','assigned','picked_up','in_transit','delivered','cancelled')),
  driver_id INTEGER REFERENCES users(id),
  vehicle_id INTEGER REFERENCES vehicles(id),
  created_at TEXT DEFAULT (datetime('now')),
  delivered_at TEXT
);

CREATE TABLE IF NOT EXISTS tracking_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// ---------- SEED (only if empty) ----------
const userCount = db.prepare("SELECT COUNT(*) c FROM users").get().c;

if (userCount === 0) {
  const hash = (pw) => bcrypt.hashSync(pw, 10);
  const insertUser = db.prepare("INSERT INTO users (name, email, password, role, phone) VALUES (?,?,?,?,?)");

  const tx = db.transaction(() => {
    // Admin
    insertUser.run("Ops Admin", "admin@fleetflow.test", hash("admin123"), "admin", "9000000001");

    // Warehouses
    const insertWarehouse = db.prepare("INSERT INTO warehouses (name, address, city) VALUES (?,?,?)");
    const wh1 = insertWarehouse.run("Central Hub", "Plot 14, Industrial Area Phase 2", "Bengaluru").lastInsertRowid;
    const wh2 = insertWarehouse.run("North Depot", "Sector 63 Logistics Park", "Noida").lastInsertRowid;

    // Drivers
    const insertDriverProfile = db.prepare("INSERT INTO driver_profiles (user_id, license_no, status) VALUES (?,?,?)");
    const drv1 = insertUser.run("Manoj Yadav", "manoj.driver@fleetflow.test", hash("driver123"), "driver", "9811200001").lastInsertRowid;
    insertDriverProfile.run(drv1, "DL-04-2019-0012345", "on_delivery");

    const drv2 = insertUser.run("Suresh Pillai", "suresh.driver@fleetflow.test", hash("driver123"), "driver", "9811200002").lastInsertRowid;
    insertDriverProfile.run(drv2, "KA-05-2021-0067890", "available");

    const drv3 = insertUser.run("Ramesh Nair", "ramesh.driver@fleetflow.test", hash("driver123"), "driver", "9811200003").lastInsertRowid;
    insertDriverProfile.run(drv3, "TN-09-2020-0054321", "off_duty");

    // Vehicles
    const insertVehicle = db.prepare("INSERT INTO vehicles (plate_no, type, capacity_kg, status, driver_id) VALUES (?,?,?,?,?)");
    const veh1 = insertVehicle.run("KA-01-AB-1234", "van", 800, "in_transit", drv1).lastInsertRowid;
    const veh2 = insertVehicle.run("KA-02-CD-5678", "truck", 3000, "available", drv2).lastInsertRowid;
    insertVehicle.run("TN-07-EF-9012", "bike", 30, "maintenance", drv3);
    insertVehicle.run("KA-03-GH-3456", "van", 800, "available", null);

    // Customers
    const cust1 = insertUser.run("Priya Nambiar", "priya.customer@fleetflow.test", hash("customer123"), "customer", "9822300001").lastInsertRowid;
    const cust2 = insertUser.run("Vikas Malhotra", "vikas.customer@fleetflow.test", hash("customer123"), "customer", "9822300002").lastInsertRowid;

    // Shipments + tracking events
    const insertShipment = db.prepare(
      `INSERT INTO shipments (customer_id, warehouse_id, destination_address, description, weight_kg, status, driver_id, vehicle_id, created_at, delivered_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`
    );
    const insertEvent = db.prepare(
      "INSERT INTO tracking_events (shipment_id, status, note, created_at) VALUES (?,?,?,?)"
    );

    function daysAgo(n) {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d.toISOString().slice(0, 19).replace("T", " ");
    }

    // Shipment 1: in transit, assigned to Manoj/van
    const s1 = insertShipment.run(
      cust1, wh1, "44 Residency Road, Bengaluru", "3 boxes of electronics parts", 45, "in_transit", drv1, veh1, daysAgo(1), null
    ).lastInsertRowid;
    insertEvent.run(s1, "pending", "Shipment booked by customer.", daysAgo(1));
    insertEvent.run(s1, "assigned", "Assigned to Manoj Yadav (KA-01-AB-1234).", daysAgo(1));
    insertEvent.run(s1, "picked_up", "Picked up from Central Hub.", daysAgo(1));
    insertEvent.run(s1, "in_transit", "En route to destination.", daysAgo(0));

    // Shipment 2: delivered
    const s2 = insertShipment.run(
      cust1, wh1, "12 MG Road, Bengaluru", "Documents envelope", 1, "delivered", drv2, veh2, daysAgo(3), daysAgo(2)
    ).lastInsertRowid;
    insertEvent.run(s2, "pending", "Shipment booked by customer.", daysAgo(3));
    insertEvent.run(s2, "assigned", "Assigned to Suresh Pillai (KA-02-CD-5678).", daysAgo(3));
    insertEvent.run(s2, "picked_up", "Picked up from Central Hub.", daysAgo(3));
    insertEvent.run(s2, "in_transit", "En route to destination.", daysAgo(2));
    insertEvent.run(s2, "delivered", "Delivered and signed for by recipient.", daysAgo(2));

    // Shipment 3: pending, unassigned
    const s3 = insertShipment.run(
      cust2, wh2, "9 Sector 21, Noida", "Pallet of packaged snacks", 220, "pending", null, null, daysAgo(0), null
    ).lastInsertRowid;
    insertEvent.run(s3, "pending", "Shipment booked by customer, awaiting assignment.", daysAgo(0));

    // Shipment 4: assigned but not yet picked up
    const s4 = insertShipment.run(
      cust2, wh1, "77 Whitefield Main Road, Bengaluru", "Office furniture (2 desks)", 90, "assigned", drv3, null, daysAgo(1), null
    ).lastInsertRowid;
    insertEvent.run(s4, "pending", "Shipment booked by customer.", daysAgo(1));
    insertEvent.run(s4, "assigned", "Assigned to Ramesh Nair.", daysAgo(0));

    console.log("Seed data inserted.");
    console.log("Login credentials:");
    console.log("  Admin:    admin@fleetflow.test / admin123");
    console.log("  Driver:   manoj.driver@fleetflow.test / driver123");
    console.log("  Customer: priya.customer@fleetflow.test / customer123");
  });

  tx();
}

module.exports = db;
