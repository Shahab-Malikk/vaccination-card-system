const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { dbGet } = require("../db");

const router = express.Router();

/**
 * POST /api/login
 * Returns JWT with role + centerId
 * Frontend uses role to decide which dashboard to show
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    const user = dbGet("SELECT * FROM users WHERE email = ?", [
      email.toLowerCase().trim(),
    ]);

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Include role and centerId in token
    const token = jwt.sign(
      {
        id: user.uuid,
        email: user.email,
        role: user.role,
        centerId: user.center_id || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" },
    );

    // If center admin — fetch center info to return
    let centerInfo = null;
    if (user.role === "center_admin" && user.center_id) {
      const center = dbGet(
        "SELECT uuid, name, logo, footer FROM centers WHERE uuid = ?",
        [user.center_id],
      );
      centerInfo = center || null;
    }

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.uuid,
        email: user.email,
        role: user.role,
        centerId: user.center_id || null,
        center: centerInfo,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
});

module.exports = router;
