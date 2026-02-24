require("dotenv").config();
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");

// sql.js is pure JavaScript SQLite — no native compilation needed
const initSqlJs = require("sql.js");

const DB_PATH = path.join(__dirname, "database.sqlite");

// Hold the db instance (loaded async)
let db = null;

/**
 * Initialize sql.js database.
 * Loads existing .sqlite file from disk if it exists,
 * otherwise creates a fresh database.
 */
const initDB = async () => {
  const SQL = await initSqlJs();

  // Load existing DB file from disk if it exists
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS vaccine_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_number TEXT NOT NULL,
      passport_no TEXT NOT NULL,
      cnic TEXT NOT NULL,
      sdw_of TEXT NOT NULL,
      travelling_country TEXT NOT NULL,
      batch_no TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      vaccine_name TEXT NOT NULL,
      vaccine_date TEXT NOT NULL,
      qr_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Save to disk after table creation
  saveToDisk();

  // Seed admin user
  await seedAdminUser();

  console.log("✅ Database initialized successfully");
};

/**
 * Save in-memory database back to disk.
 * Must be called after every write operation.
 */
const saveToDisk = () => {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
};

/**
 * Seed initial admin user if not exists.
 */
const seedAdminUser = async () => {
  const email = process.env.SEED_EMAIL || "admin@mdc.com";
  const password = process.env.SEED_PASSWORD || "Admin@MDC2024";

  const result = db.exec(`SELECT id FROM users WHERE email = '${email}'`);

  if (result.length > 0 && result[0].values.length > 0) {
    console.log("ℹ️  Admin user already exists — skipping seed");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  db.run(`INSERT INTO users (email, password) VALUES (?, ?)`, [
    email,
    hashedPassword,
  ]);

  saveToDisk();
  console.log(`✅ Admin user seeded: ${email}`);
};

/**
 * Helper: run a SELECT and return array of row objects
 */
const dbAll = (sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  } catch (err) {
    console.error("dbAll error:", err);
    return [];
  }
};

/**
 * Helper: run a SELECT and return single row object or null
 */
const dbGet = (sql, params = []) => {
  const rows = dbAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Helper: run INSERT/UPDATE/DELETE
 * Returns { lastInsertRowid, changes }
 */
const dbRun = (sql, params = []) => {
  db.run(sql, params);
  const lastInsertRowid = db.exec("SELECT last_insert_rowid() as id")[0]
    ?.values[0][0];
  saveToDisk();
  return { lastInsertRowid };
};

module.exports = { initDB, dbAll, dbGet, dbRun };
