const express = require("express");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const { dbGet, dbAll, dbRun } = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const generateQR = require("../utils/generateQR");

const router = express.Router();

// ============================================================
// GET /api/records/search?q=xxx — Center admin search
// Search by CNIC or Passport No
// ============================================================
router.get("/records/search", authMiddleware, (req, res) => {
  try {
    if (req.user.role !== "center_admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: "Search query too short." });
    }

    const centerId = req.user.centerId;
    const search = `%${q.trim()}%`;

    const records = dbAll(
      `SELECT * FROM vaccine_records 
       WHERE center_id = ? 
       AND (
         UPPER(passport_no) LIKE UPPER(?) 
         OR cnic LIKE ?
       )
       ORDER BY created_at DESC`,
      [centerId, search, search],
    );

    res.json({ records: records.map(mapRecord) });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Search failed." });
  }
});

// ============================================================
// POST /api/submit — Center admin only
// ============================================================
router.post("/submit", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "center_admin") {
      return res
        .status(403)
        .json({ message: "Only center admins can submit records." });
    }

    const centerId = req.user.centerId;
    if (!centerId) {
      return res
        .status(400)
        .json({ message: "No center associated with this account." });
    }

    const {
      name,
      contactNumber,
      passportNo,
      cnic,
      sdwOf,
      travellingCountry,
      batchUuid,
      vaccineDate,
    } = req.body;

    // Validation — required fields only
    const errors = {};
    if (!name?.trim()) errors.name = "Name is required";
    if (!passportNo?.trim()) errors.passportNo = "Passport No is required";
    if (!sdwOf?.trim()) errors.sdwOf = "S/D/W of is required";
    if (!travellingCountry?.trim())
      errors.travellingCountry = "Travelling country is required";
    if (!batchUuid) errors.batchUuid = "Please select a vaccine";
    if (!vaccineDate) errors.vaccineDate = "Vaccine date is required";

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    // Fetch batch details
    const batch = dbGet("SELECT * FROM vaccine_batches WHERE uuid = ?", [
      batchUuid,
    ]);
    if (!batch) {
      return res
        .status(400)
        .json({ message: "Selected vaccine batch not found." });
    }

    const recordUuid = uuidv4();

    dbRun(
      `INSERT INTO vaccine_records 
        (uuid, center_id, batch_uuid, name, contact_number, passport_no, cnic,
         sdw_of, travelling_country, vaccine_name, vaccine_date, expiry_date, batch_no)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recordUuid,
        centerId,
        batchUuid,
        name.trim(),
        contactNumber?.trim() || null,
        passportNo.trim().toUpperCase(),
        cnic?.trim() || null,
        sdwOf.trim(),
        travellingCountry.trim(),
        batch.vaccine_name,
        vaccineDate,
        batch.expiry_date,
        batch.batch_no,
      ],
    );

    // Generate QR with signed JWT token
    const qrCode = await generateQR(recordUuid);
    dbRun("UPDATE vaccine_records SET qr_code = ? WHERE uuid = ?", [
      qrCode,
      recordUuid,
    ]);

    // Fetch center info for slip
    const center = dbGet(
      "SELECT name, logo, footer FROM centers WHERE uuid = ?",
      [centerId],
    );

    res.status(201).json({
      message: "Vaccination record saved successfully",
      record: {
        id: recordUuid,
        name: name.trim(),
        contactNumber: contactNumber?.trim() || null,
        passportNo: passportNo.trim().toUpperCase(),
        cnic: cnic?.trim() || null,
        sdwOf: sdwOf.trim(),
        travellingCountry: travellingCountry.trim(),
        vaccineName: batch.vaccine_name,
        vaccineDate,
        expiryDate: batch.expiry_date,
        batchNo: batch.batch_no,
        batchUuid,
        qrCode,
        center,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Submit error:", err);
    res.status(500).json({ message: "Failed to save record." });
  }
});

// ============================================================
// GET /api/records — Center admin sees own records only
// ============================================================
router.get("/records", authMiddleware, (req, res) => {
  try {
    if (req.user.role !== "center_admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    const centerId = req.user.centerId;
    const records = dbAll(
      `SELECT * FROM vaccine_records WHERE center_id = ? ORDER BY created_at DESC`,
      [centerId],
    );

    res.json({ records: records.map(mapRecord) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch records." });
  }
});

// ============================================================
// PUT /api/records/:uuid — Edit record (restricted fields)
// Cannot edit: batch_no, expiry_date, vaccine_name
// ============================================================
router.put("/records/:uuid", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "center_admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    const { uuid } = req.params;
    const centerId = req.user.centerId;

    // Make sure record belongs to this center
    const existing = dbGet(
      "SELECT * FROM vaccine_records WHERE uuid = ? AND center_id = ?",
      [uuid, centerId],
    );

    if (!existing) {
      return res.status(404).json({ message: "Record not found." });
    }

    const {
      name,
      contactNumber,
      passportNo,
      cnic,
      sdwOf,
      travellingCountry,
      vaccineDate,
    } = req.body;

    // Validation
    const errors = {};
    if (!name?.trim()) errors.name = "Name is required";
    if (!passportNo?.trim()) errors.passportNo = "Passport No is required";
    if (!sdwOf?.trim()) errors.sdwOf = "S/D/W of is required";
    if (!travellingCountry?.trim())
      errors.travellingCountry = "Travelling country is required";
    if (!vaccineDate) errors.vaccineDate = "Vaccine date is required";

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    dbRun(
      `UPDATE vaccine_records SET
        name = ?, contact_number = ?, passport_no = ?,
        cnic = ?, sdw_of = ?, travelling_country = ?, vaccine_date = ?
       WHERE uuid = ? AND center_id = ?`,
      [
        name.trim(),
        contactNumber?.trim() || null,
        passportNo.trim().toUpperCase(),
        cnic?.trim() || null,
        sdwOf.trim(),
        travellingCountry.trim(),
        vaccineDate,
        uuid,
        centerId,
      ],
    );

    const updated = dbGet("SELECT * FROM vaccine_records WHERE uuid = ?", [
      uuid,
    ]);
    const center = dbGet(
      "SELECT name, logo, footer FROM centers WHERE uuid = ?",
      [centerId],
    );

    res.json({
      message: "Record updated successfully",
      record: { ...mapRecord(updated), center },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update record." });
  }
});

// ============================================================
// GET /api/verify?token=xxx — PUBLIC (QR scan)
// ============================================================
router.get("/verify", (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "No token provided." });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res
        .status(401)
        .json({ message: "Invalid or expired verification token." });
    }

    const uuid = decoded.uid;
    if (!uuid)
      return res.status(400).json({ message: "Invalid token payload." });

    const record = dbGet("SELECT * FROM vaccine_records WHERE uuid = ?", [
      uuid,
    ]);
    if (!record) return res.status(404).json({ message: "Record not found." });

    // Fetch center branding for public view
    const center = dbGet(
      "SELECT name, logo, footer FROM centers WHERE uuid = ?",
      [record.center_id],
    );

    res.json({ record: { ...mapRecord(record), center } });
  } catch (err) {
    res.status(500).json({ message: "Failed to verify record." });
  }
});

// ============================================================
// Map DB snake_case to camelCase
// ============================================================
const mapRecord = (record) => ({
  id: record.uuid,
  name: record.name,
  contactNumber: record.contact_number,
  passportNo: record.passport_no,
  cnic: record.cnic,
  sdwOf: record.sdw_of,
  travellingCountry: record.travelling_country,
  vaccineName: record.vaccine_name,
  vaccineDate: record.vaccine_date,
  expiryDate: record.expiry_date,
  batchNo: record.batch_no,
  batchUuid: record.batch_uuid,
  centerId: record.center_id,
  qrCode: record.qr_code,
  createdAt: record.created_at,
});

module.exports = router;
