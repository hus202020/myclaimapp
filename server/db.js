const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./claims.db');

db.serialize(() => {
  // Create a config table to store application settings
  db.run(`CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT
  )`);

  // Table for claim categories (each with an associated claim_code)
  db.run(`CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      claim_code INTEGER NOT NULL
  )`);

  // Table for payees
  db.run(`CREATE TABLE IF NOT EXISTS payees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      account_number TEXT
  )`);

  // Table for claims
  db.run(`CREATE TABLE IF NOT EXISTS claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      claim_date TEXT,
      claim_number TEXT,
      category_id INTEGER,
      claim_code INTEGER,
      payee_id INTEGER,
      payment_amount REAL,
      pdf_data TEXT,
      FOREIGN KEY(category_id) REFERENCES categories(id),
      FOREIGN KEY(payee_id) REFERENCES payees(id)
  )`);

  // Table to store PDF template configuration (as JSON)
  db.run(`CREATE TABLE IF NOT EXISTS pdf_template (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      template_config TEXT
  )`);

  // Insert default claim start number if not exists
  db.get("SELECT value FROM config WHERE key = 'claim_start_number'", (err, row) => {
    if (!row) {
      db.run("INSERT INTO config (key, value) VALUES ('claim_start_number', '10000')");
    }
  });

  // Insert a default PDF template if not exists
  db.get("SELECT template_config FROM pdf_template WHERE id = 1", (err, row) => {
    if (!row) {
      const defaultTemplate = JSON.stringify({
        title: "Claim Form",
        fields: [
          "Claim Date",
          "Claim Number",
          "Claim Category",
          "Claim Code",
          "Payee Name",
          "Payee Account Number",
          "Payment Amount"
        ]
      });
      db.run("INSERT INTO pdf_template (id, template_config) VALUES (1, ?)", [defaultTemplate]);
    }
  });
});

module.exports = db;