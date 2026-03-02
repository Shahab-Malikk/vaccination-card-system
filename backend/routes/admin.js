const express = require("express");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { dbGet, dbAll, dbRun } = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Middleware — super admin only
const superAdminOnly = (req, res, next) => {
  if (req.user.role !== "super_admin") {
    return res
      .status(403)
      .json({ message: "Access denied. Super admin only." });
  }
  next();
};

// ============================================================
// CENTERS
// ============================================================

// GET all centers
router.get("/centers", authMiddleware, superAdminOnly, (req, res) => {
  try {
    const centers = dbAll("SELECT * FROM centers ORDER BY created_at DESC");
    res.json({ centers });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch centers." });
  }
});

// POST create new center
router.post("/centers", authMiddleware, superAdminOnly, (req, res) => {
  try {
    const { name, logo, footer } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Center name is required." });
    }

    const centerUuid = uuidv4();

    dbRun(
      `INSERT INTO centers (uuid, name, logo, footer) VALUES (?, ?, ?, ?)`,
      [centerUuid, name.trim(), logo || null, footer?.trim() || null],
    );

    const center = dbGet("SELECT * FROM centers WHERE uuid = ?", [centerUuid]);
    res.status(201).json({ message: "Center created successfully", center });
  } catch (err) {
    console.error("Create center error:", err);
    res.status(500).json({ message: "Failed to create center." });
  }
});

// PUT update center
router.put("/centers/:uuid", authMiddleware, superAdminOnly, (req, res) => {
  try {
    const { uuid } = req.params;
    const { name, logo, footer } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Center name is required." });
    }

    const existing = dbGet("SELECT id FROM centers WHERE uuid = ?", [uuid]);
    if (!existing) {
      return res.status(404).json({ message: "Center not found." });
    }

    dbRun(`UPDATE centers SET name = ?, logo = ?, footer = ? WHERE uuid = ?`, [
      name.trim(),
      logo || null,
      footer?.trim() || null,
      uuid,
    ]);

    const center = dbGet("SELECT * FROM centers WHERE uuid = ?", [uuid]);
    res.json({ message: "Center updated successfully", center });
  } catch (err) {
    res.status(500).json({ message: "Failed to update center." });
  }
});

// DELETE center
router.delete("/centers/:uuid", authMiddleware, superAdminOnly, (req, res) => {
  try {
    const { uuid } = req.params;

    const existing = dbGet("SELECT id FROM centers WHERE uuid = ?", [uuid]);
    if (!existing) {
      return res.status(404).json({ message: "Center not found." });
    }

    dbRun("DELETE FROM centers WHERE uuid = ?", [uuid]);
    res.json({ message: "Center deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete center." });
  }
});

// ============================================================
// CENTER USERS
// ============================================================

// GET user for a center
router.get(
  "/centers/:uuid/user",
  authMiddleware,
  superAdminOnly,
  (req, res) => {
    try {
      const { uuid } = req.params;
      const user = dbGet(
        "SELECT uuid, email, role, center_id, created_at FROM users WHERE center_id = ?",
        [uuid],
      );
      res.json({ user: user || null });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch user." });
    }
  },
);

// POST create user for a center
router.post(
  "/centers/:uuid/user",
  authMiddleware,
  superAdminOnly,
  async (req, res) => {
    try {
      const { uuid } = req.params;
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required." });
      }

      if (password.length < 6) {
        return res
          .status(400)
          .json({ message: "Password must be at least 6 characters." });
      }

      // Check center exists
      const center = dbGet("SELECT id FROM centers WHERE uuid = ?", [uuid]);
      if (!center) {
        return res.status(404).json({ message: "Center not found." });
      }

      // Check email not already used
      const existing = dbGet("SELECT id FROM users WHERE email = ?", [
        email.toLowerCase().trim(),
      ]);
      if (existing) {
        return res.status(409).json({ message: "Email already in use." });
      }

      // Check center doesn't already have a user
      const existingUser = dbGet("SELECT id FROM users WHERE center_id = ?", [
        uuid,
      ]);
      if (existingUser) {
        return res.status(409).json({
          message:
            "This center already has a user. Delete existing user first.",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const userUuid = uuidv4();

      dbRun(
        `INSERT INTO users (uuid, email, password, role, center_id) VALUES (?, ?, ?, ?, ?)`,
        [
          userUuid,
          email.toLowerCase().trim(),
          hashedPassword,
          "center_admin",
          uuid,
        ],
      );

      res.status(201).json({
        message: "User created successfully",
        user: {
          uuid: userUuid,
          email: email.toLowerCase().trim(),
          role: "center_admin",
          centerId: uuid,
        },
      });
    } catch (err) {
      console.error("Create user error:", err);
      res.status(500).json({ message: "Failed to create user." });
    }
  },
);

// DELETE center user
router.delete(
  "/centers/:uuid/user",
  authMiddleware,
  superAdminOnly,
  (req, res) => {
    try {
      const { uuid } = req.params;
      dbRun("DELETE FROM users WHERE center_id = ?", [uuid]);
      res.json({ message: "User deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete user." });
    }
  },
);

// ============================================================
// VACCINE BATCHES — Global
// ============================================================

// GET all batches
router.get("/batches", authMiddleware, (req, res) => {
  try {
    const batches = dbAll(
      "SELECT * FROM vaccine_batches ORDER BY created_at DESC",
    );
    res.json({ batches });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch batches." });
  }
});

// POST create batch — super admin only
router.post("/batches", authMiddleware, superAdminOnly, (req, res) => {
  try {
    const { vaccineName, batchNo, expiryDate } = req.body;

    if (!vaccineName?.trim() || !batchNo?.trim() || !expiryDate) {
      return res.status(400).json({
        message: "Vaccine name, batch no and expiry date are required.",
      });
    }

    const batchUuid = uuidv4();

    dbRun(
      `INSERT INTO vaccine_batches (uuid, vaccine_name, batch_no, expiry_date) VALUES (?, ?, ?, ?)`,
      [batchUuid, vaccineName.trim(), batchNo.trim().toUpperCase(), expiryDate],
    );

    const batch = dbGet("SELECT * FROM vaccine_batches WHERE uuid = ?", [
      batchUuid,
    ]);
    res.status(201).json({ message: "Batch created successfully", batch });
  } catch (err) {
    res.status(500).json({ message: "Failed to create batch." });
  }
});

// DELETE batch
router.delete("/batches/:uuid", authMiddleware, superAdminOnly, (req, res) => {
  try {
    const { uuid } = req.params;
    dbRun("DELETE FROM vaccine_batches WHERE uuid = ?", [uuid]);
    res.json({ message: "Batch deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete batch." });
  }
});

module.exports = router;
