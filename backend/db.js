require("dotenv").config();
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

const initSqlJs = require("sql.js");

const DB_PATH = path.join(__dirname, "database.sqlite");
let db = null;

const initDB = async () => {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Users table — role based
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'center_admin',
      center_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Centers table
  db.run(`
    CREATE TABLE IF NOT EXISTS centers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      logo TEXT,
      footer TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Vaccine batches — global, defined by super admin
  db.run(`
    CREATE TABLE IF NOT EXISTS vaccine_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      vaccine_name TEXT NOT NULL,
      batch_no TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Vaccine records — linked to center
  db.run(`
    CREATE TABLE IF NOT EXISTS vaccine_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      center_id TEXT NOT NULL,
      batch_uuid TEXT,
      name TEXT NOT NULL,
      contact_number TEXT,
      passport_no TEXT NOT NULL,
      cnic TEXT,
      sdw_of TEXT NOT NULL,
      travelling_country TEXT NOT NULL,
      vaccine_name TEXT NOT NULL,
      vaccine_date TEXT NOT NULL,
      expiry_date TEXT,
      batch_no TEXT,
      qr_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveToDisk();
  await seedSuperAdmin();
  console.log("✅ Database initialized successfully");
};

const saveToDisk = () => {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
};

// Seed super admin user on first run
const seedSuperAdmin = async () => {
  const email = process.env.SEED_EMAIL || "admin@mdc.com";
  const password = process.env.SEED_PASSWORD || "Admin@MDC2024";

  const result = db.exec(`SELECT id FROM users WHERE email = '${email}'`);
  if (result.length > 0 && result[0].values.length > 0) {
    console.log("ℹ️  Super admin already exists — skipping seed");
    return;
  }

  const { v4: uuidv4 } = require("uuid");
  const hashedPassword = await bcrypt.hash(password, 12);

  db.run(
    `INSERT INTO users (uuid, email, password, role, center_id) VALUES (?, ?, ?, ?, ?)`,
    [uuidv4(), email, hashedPassword, "super_admin", null],
  );

  saveToDisk();
  console.log(`✅ Super admin seeded: ${email}`);
};

// Helper: SELECT multiple rows
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

// Helper: SELECT single row
const dbGet = (sql, params = []) => {
  const rows = dbAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
};

// Helper: INSERT / UPDATE / DELETE
const dbRun = (sql, params = []) => {
  db.run(sql, params);
  const lastInsertRowid = db.exec("SELECT last_insert_rowid() as id")[0]
    ?.values[0][0];
  saveToDisk();
  return { lastInsertRowid };
};

module.exports = { initDB, dbAll, dbGet, dbRun };
