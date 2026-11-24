# FleetFlow — Logistics & Fleet Management Platform

**CodSoft Internship · Full-Stack Web Development · Task 5**

A logistics management platform for managing shipments, drivers, vehicles,
and warehouses, giving dispatchers complete visibility over delivery
operations while customers track their shipments and drivers update
delivery status from a mobile-friendly interface.

## Tech stack

- **Frontend:** React (Vite), React Router, Tailwind CSS v4, Axios
- **Backend:** Node.js, Express
- **Database:** SQLite (via `better-sqlite3` — no separate database server needed)
- **Auth:** JWT + bcrypt password hashing

## Features

- **Role-based access** — Admin (dispatch), Driver, and Customer each get a dedicated dashboard and permissions.
- **Admin:** assign a driver and vehicle to any pending shipment; monitor the full shipment list with status filters and a per-shipment tracking timeline; manage the vehicle fleet (add, update status, remove); manage the driver roster (view license, assigned vehicle, active load); manage warehouses; view fleet-wide stats (active shipments, deliveries today, fleet/driver availability).
- **Driver:** toggle their own availability (available / on delivery / off duty); see every shipment assigned to them with pickup and customer details; advance each delivery through pending → picked up → in transit → delivered with one tap; view full tracking history per shipment.
- **Customer:** book a new shipment from any warehouse to any destination; track every shipment's live status and full timestamped tracking history; view shipment stats.
- Self-service **sign-up** for both drivers (with license number) and customers.
- Every status change is recorded as a timestamped tracking event, giving a full audit trail visible to admin, the assigned driver, and the shipment's customer.
- Real-time-style visibility is achieved via periodic polling (driver deliveries and admin views refresh automatically) rather than a persistent WebSocket connection, to keep the stack dependency-free — this could be swapped for Socket.IO in a production version for instant push updates.

## Project structure

```
fleetflow/
├── backend/          Express API + SQLite database
│   ├── db.js           schema + seed data (auto-runs on first start)
│   ├── server.js        app entry point
│   ├── middleware/       JWT auth + role guard
│   └── routes/           auth, vehicles, warehouses, drivers, shipments, dashboard
└── frontend/         React (Vite) single-page app
    └── src/
        ├── pages/admin | driver | customer
        ├── components/    Layout, shared UI (StatCard, Modal, Stamp, Timeline, etc.)
        ├── AuthContext.jsx
        └── api.js          axios client with JWT injection
```

## Getting started

### 1. Backend

```bash
cd backend
npm install
npm start
```

The API starts on **http://localhost:5004**. On first run it automatically
creates `fleetflow.db` (SQLite file) and seeds it with sample warehouses,
vehicles, drivers, customers, and shipments in various stages — the demo
credentials are printed in the terminal.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app opens on **http://localhost:5173**. It's configured to proxy `/api`
requests to the backend on port 5004, so just make sure the backend is
running first.

### 3. Log in

Use any of the seeded demo accounts (also available as quick-fill buttons on
the login screen), or sign up as a new driver or customer directly from the
login page:

| Role     | Email                              | Password       |
|----------|--------------------------------------|----------------|
| Admin    | `admin@fleetflow.test`              | `admin123`     |
| Driver   | `manoj.driver@fleetflow.test`       | `driver123`    |
| Driver   | `suresh.driver@fleetflow.test`      | `driver123`    |
| Customer | `priya.customer@fleetflow.test`     | `customer123`  |

## Resetting the data

Delete `backend/fleetflow.db*` and restart the backend — it will recreate
the schema and reseed demo data automatically.

## Notes

- This is a demo/learning project (per the internship's scope of a working
  prototype); the JWT secret in `middleware/auth.js` should be moved to an
  environment variable (`.env`) before any real deployment.
- There's no live GPS map in this version — tracking is expressed as a
  timestamped status timeline (pending → assigned → picked up → in transit →
  delivered) rather than a map with live coordinates, keeping the project
  dependency-free (no external maps API key required).
