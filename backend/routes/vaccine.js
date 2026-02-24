const express = require("express");
const { dbGet, dbRun } = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const generateQR = require("../utils/generateQR");

const router = express.Router();

router.post("/submit", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      contactNumber,
      passportNo,
      cnic,
      sdwOf,
      travellingCountry,
      batchNo,
      expiryDate,
      vaccineName,
      vaccineDate,
    } = req.body;

    // Validation
    const errors = {};
    if (!name?.trim()) errors.name = "Name is required";
    if (!contactNumber?.trim())
      errors.contactNumber = "Contact number is required";
    if (!passportNo?.trim()) errors.passportNo = "Passport No is required";
    if (!cnic?.trim()) errors.cnic = "CNIC is required";
    else if (!/^\d{5}-\d{7}-\d{1}$/.test(cnic.trim()))
      errors.cnic = "Invalid CNIC format (12345-1234567-1)";
    if (!sdwOf?.trim()) errors.sdwOf = "S/D/W of is required";
    if (!travellingCountry?.trim())
      errors.travellingCountry = "Travelling country is required";
    if (!batchNo?.trim()) errors.batchNo = "Batch No is required";
    if (!expiryDate) errors.expiryDate = "Expiry date is required";
    if (!vaccineName?.trim()) errors.vaccineName = "Vaccine name is required";
    if (!vaccineDate) errors.vaccineDate = "Vaccine date is required";

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    // Insert record using helper
    const { lastInsertRowid } = dbRun(
      `INSERT INTO vaccine_records 
        (name, contact_number, passport_no, cnic, sdw_of, travelling_country, 
         batch_no, expiry_date, vaccine_name, vaccine_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        contactNumber.trim(),
        passportNo.trim().toUpperCase(),
        cnic.trim(),
        sdwOf.trim(),
        travellingCountry.trim(),
        batchNo.trim().toUpperCase(),
        expiryDate,
        vaccineName.trim(),
        vaccineDate,
      ],
    );

    const recordId = lastInsertRowid;

    // Generate QR
    const qrCode = await generateQR(recordId);

    // Save QR back to record
    dbRun("UPDATE vaccine_records SET qr_code = ? WHERE id = ?", [
      qrCode,
      recordId,
    ]);

    res.status(201).json({
      message: "Vaccination record saved successfully",
      record: {
        id: recordId,
        name: name.trim(),
        contactNumber: contactNumber.trim(),
        passportNo: passportNo.trim().toUpperCase(),
        cnic: cnic.trim(),
        sdwOf: sdwOf.trim(),
        travellingCountry: travellingCountry.trim(),
        batchNo: batchNo.trim().toUpperCase(),
        expiryDate,
        vaccineName: vaccineName.trim(),
        vaccineDate,
        qrCode,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Submit error:", err);
    res
      .status(500)
      .json({ message: "Failed to save record. Please try again." });
  }
});

router.get("/data/:id", (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ message: "Invalid record ID." });
    }

    const record = dbGet("SELECT * FROM vaccine_records WHERE id = ?", [
      Number(id),
    ]);

    if (!record) {
      return res.status(404).json({ message: "Vaccination record not found." });
    }

    res.json({
      record: {
        id: record.id,
        name: record.name,
        contactNumber: record.contact_number,
        passportNo: record.passport_no,
        cnic: record.cnic,
        sdwOf: record.sdw_of,
        travellingCountry: record.travelling_country,
        batchNo: record.batch_no,
        expiryDate: record.expiry_date,
        vaccineName: record.vaccine_name,
        vaccineDate: record.vaccine_date,
        qrCode: record.qr_code,
        createdAt: record.created_at,
      },
    });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ message: "Failed to retrieve record." });
  }
});

module.exports = router;
