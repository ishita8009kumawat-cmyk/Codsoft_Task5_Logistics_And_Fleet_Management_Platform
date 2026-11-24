const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { JWT_SECRET, authenticate } = require("../middleware/auth");

const router = express.Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  let profile = null;
  if (user.role === "driver") {
    profile = db.prepare("SELECT * FROM driver_profiles WHERE user_id = ?").get(user.id);
  }

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone },
    profile,
  });
});

// Self-service signup for drivers and customers
router.post("/register", (req, res) => {
  const { name, email, password, role, phone, license_no } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "name, email, password and role are required" });
  }
  if (!["driver", "customer"].includes(role)) {
    return res.status(400).json({ error: "role must be 'driver' or 'customer'" });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return res.status(409).json({ error: "An account with this email already exists" });

  const hash = bcrypt.hashSync(password, 10);
  const tx = db.transaction(() => {
    const userId = db
      .prepare("INSERT INTO users (name, email, password, role, phone) VALUES (?,?,?,?,?)")
      .run(name, email, hash, role, phone || null).lastInsertRowid;

    if (role === "driver") {
      db.prepare("INSERT INTO driver_profiles (user_id, license_no, status) VALUES (?,?,'off_duty')").run(
        userId,
        license_no || null
      );
    }
    return userId;
  });

  const userId = tx();
  const user = { id: userId, name, email, role };
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, {
    expiresIn: "8h",
  });

  res.status(201).json({ token, user });
});

router.get("/me", authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
