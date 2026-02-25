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

  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Vaccine records table — with uuid column
  db.run(`
    CREATE TABLE IF NOT EXISTS vaccine_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
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

  saveToDisk();
  await seedAdminUser();

  console.log("✅ Database initialized successfully");
};

const saveToDisk = () => {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
};

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

const dbGet = (sql, params = []) => {
  const rows = dbAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
};

const dbRun = (sql, params = []) => {
  db.run(sql, params);
  const lastInsertRowid = db.exec("SELECT last_insert_rowid() as id")[0]
    ?.values[0][0];
  saveToDisk();
  return { lastInsertRowid };
};

module.exports = { initDB, dbAll, dbGet, dbRun };
