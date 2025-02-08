const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

// Get all claim categories
app.get('/api/categories', (req, res) => {
  db.all("SELECT * FROM categories", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ categories: rows });
  });
});

// Add a new claim category
app.post('/api/categories', (req, res) => {
  const { name, claim_code } = req.body;
  if (!name || claim_code === undefined) {
    return res.status(400).json({ error: 'Missing name or claim_code' });
  }
  db.run("INSERT INTO categories (name, claim_code) VALUES (?, ?)", [name, claim_code], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID });
  });
});

// Delete a claim category
app.delete('/api/categories/:id', (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM categories WHERE id = ?", id, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ deletedID: id });
  });
});

// Get payees for autocomplete (search by query string)
app.get('/api/payees', (req, res) => {
  const query = req.query.q || '';
  db.all("SELECT * FROM payees WHERE name LIKE ?", [`%${query}%`], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ payees: rows });
  });
});

// Add a new payee if not exists (or update account number)
app.post('/api/payees', (req, res) => {
  const { name, account_number } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Missing name' });
  }
  db.run("INSERT OR IGNORE INTO payees (name, account_number) VALUES (?, ?)", [name, account_number], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // If the payee already exists and an account number is provided, update it.
    if (this.changes === 0 && account_number) {
      db.run("UPDATE payees SET account_number = ? WHERE name = ?", [account_number, name], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Updated existing payee' });
      });
    } else {
      res.json({ id: this.lastID, message: 'Payee added' });
    }
  });
});

// Get the next claim number (a five-digit running number)
app.get('/api/claim/next-number', (req, res) => {
  // Look for the last claim; if none, return the configured starting number.
  db.get("SELECT claim_number FROM claims ORDER BY id DESC LIMIT 1", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      let nextNumber = parseInt(row.claim_number, 10) + 1;
      res.json({ nextNumber: nextNumber.toString().padStart(5, '0') });
    } else {
      db.get("SELECT value FROM config WHERE key = 'claim_start_number'", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        let start = parseInt(row.value, 10);
        res.json({ nextNumber: start.toString().padStart(5, '0') });
      });
    }
  });
});

// Create a new claim record
app.post('/api/claims', (req, res) => {
  const { claim_date, category_id, payee_name, payment_amount } = req.body;
  if (!claim_date || !category_id || !payee_name || !payment_amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Determine the next claim number
  db.get("SELECT claim_number FROM claims ORDER BY id DESC LIMIT 1", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    let nextNumber;
    if (row) {
      nextNumber = (parseInt(row.claim_number, 10) + 1).toString().padStart(5, '0');
    } else {
      db.get("SELECT value FROM config WHERE key = 'claim_start_number'", (err, configRow) => {
        if (err) return res.status(500).json({ error: err.message });
        nextNumber = parseInt(configRow.value, 10).toString().padStart(5, '0');
        insertClaim(nextNumber);
      });
      return;
    }
    insertClaim(nextNumber);
  });

  function insertClaim(claim_number) {
    // Get the claim code from the selected category
    db.get("SELECT claim_code FROM categories WHERE id = ?", category_id, (err, catRow) => {
      if (err) return res.status(500).json({ error: err.message });
      const claim_code = catRow ? catRow.claim_code : 0;
      // Ensure the payee exists (or add it automatically)
      db.get("SELECT id FROM payees WHERE name = ?", payee_name, (err, payeeRow) => {
        if (err) return res.status(500).json({ error: err.message });
        if (payeeRow) {
          insertClaimRecord(payeeRow.id);
        } else {
          db.run("INSERT INTO payees (name) VALUES (?)", [payee_name], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            insertClaimRecord(this.lastID);
          });
        }
      });

      function insertClaimRecord(payee_id) {
        db.run(
          "INSERT INTO claims (claim_date, claim_number, category_id, claim_code, payee_id, payment_amount) VALUES (?, ?, ?, ?, ?, ?)",
          [claim_date, claim_number, category_id, claim_code, payee_id, payment_amount],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ claim_id: this.lastID, claim_number });
          }
        );
      }
    });
  }
});

// Get all claims (for management purposes)
app.get('/api/claims', (req, res) => {
  const sql = `SELECT claims.*, categories.name as category_name, payees.name as payee_name, payees.account_number as payee_account 
               FROM claims 
               LEFT JOIN categories ON claims.category_id = categories.id 
               LEFT JOIN payees ON claims.payee_id = payees.id`;
  db.all(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ claims: rows });
  });
});

// Get the PDF template configuration
app.get('/api/pdf-template', (req, res) => {
  db.get("SELECT template_config FROM pdf_template WHERE id = 1", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ template: row ? JSON.parse(row.template_config) : {} });
  });
});

// Update the PDF template configuration
app.post('/api/pdf-template', (req, res) => {
  const { template } = req.body;
  if (!template) return res.status(400).json({ error: 'Missing template data' });
  const templateConfig = JSON.stringify(template);
  db.run("UPDATE pdf_template SET template_config = ? WHERE id = 1", [templateConfig], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Template updated' });
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});