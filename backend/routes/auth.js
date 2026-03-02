const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { dbGet, dbRun } = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/login
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

// POST /api/change-password — protected, any logged in user
router.post("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new password are required." });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters." });
    }

    if (currentPassword === newPassword) {
      return res
        .status(400)
        .json({
          message: "New password must be different from current password.",
        });
    }

    // Fetch user from DB using JWT id
    const user = dbGet("SELECT * FROM users WHERE uuid = ?", [req.user.id]);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Current password is incorrect." });
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    dbRun("UPDATE users SET password = ? WHERE uuid = ?", [
      hashedPassword,
      req.user.id,
    ]);

    res.json({ message: "Password changed successfully." });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Failed to change password." });
  }
});

module.exports = router;
