const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3075;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = file.fieldname === 'images' ? 'images' : 'documents';
    const dir = path.join(uploadsDir, type);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Initialize database
const db = require('./database');

// ============== PARTNERS API ==============

// Get all partners
app.get('/api/partners', (req, res) => {
  try {
    const partners = db.prepare('SELECT * FROM partners ORDER BY created_at DESC').all();
    res.json(partners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single partner
app.get('/api/partners/:id', (req, res) => {
  try {
    const partner = db.prepare('SELECT * FROM partners WHERE id = ?').get(req.params.id);
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    res.json(partner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create partner
app.post('/api/partners', (req, res) => {
  try {
    const id = uuidv4();
    const partner = { id, ...req.body, status: 'pending' };

    const stmt = db.prepare(`
      INSERT INTO partners (id, company_name, contact_person, email, phone, address, city, state, pincode, gst_number, pan_number, bank_name, bank_account, ifsc_code, specialization, experience_years, certifications, status)
      VALUES (@id, @company_name, @contact_person, @email, @phone, @address, @city, @state, @pincode, @gst_number, @pan_number, @bank_name, @bank_account, @ifsc_code, @specialization, @experience_years, @certifications, @status)
    `);

    stmt.run(partner);
    res.status(201).json({ id, message: 'Partner created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update partner
app.put('/api/partners/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields = Object.keys(updates).map(key => `${key} = @${key}`).join(', ');
    const stmt = db.prepare(`UPDATE partners SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`);

    stmt.run({ id, ...updates });
    res.json({ message: 'Partner updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete partner
app.delete('/api/partners/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM partners WHERE id = ?').run(req.params.id);
    res.json({ message: 'Partner deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============== PRODUCTS API ==============

// Get all products
app.get('/api/products', (req, res) => {
  try {
    const { partner_id, status, category } = req.query;
    let query = `
      SELECT p.*, par.company_name as partner_name
      FROM products p
      LEFT JOIN partners par ON p.partner_id = par.id
      WHERE 1=1
    `;
    const params = [];

    if (partner_id) {
      query += ' AND p.partner_id = ?';
      params.push(partner_id);
    }
    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }
    if (category) {
      query += ' AND p.category = ?';
      params.push(category);
    }

    query += ' ORDER BY p.created_at DESC';

    const products = db.prepare(query).all(...params);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  try {
    const product = db.prepare(`
      SELECT p.*, par.company_name as partner_name
      FROM products p
      LEFT JOIN partners par ON p.partner_id = par.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create product
app.post('/api/products', upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'documents', maxCount: 10 }
]), (req, res) => {
  try {
    const id = uuidv4();
    const images = req.files?.images?.map(f => `/uploads/images/${f.filename}`) || [];
    const documents = req.files?.documents?.map(f => `/uploads/documents/${f.filename}`) || [];

    const product = {
      id,
      ...req.body,
      images: JSON.stringify(images),
      documents: JSON.stringify(documents),
      status: req.body.status || 'draft'
    };

    const stmt = db.prepare(`
      INSERT INTO products (id, partner_id, name, category, brand, model, year_of_manufacture, condition, price, description, specifications, warranty_months, images, documents, status)
      VALUES (@id, @partner_id, @name, @category, @brand, @model, @year_of_manufacture, @condition, @price, @description, @specifications, @warranty_months, @images, @documents, @status)
    `);

    stmt.run(product);
    res.status(201).json({ id, message: 'Product created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product
app.put('/api/products/:id', upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'documents', maxCount: 10 }
]), (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (req.files?.images) {
      const existingProduct = db.prepare('SELECT images FROM products WHERE id = ?').get(id);
      const existingImages = JSON.parse(existingProduct?.images || '[]');
      const newImages = req.files.images.map(f => `/uploads/images/${f.filename}`);
      updates.images = JSON.stringify([...existingImages, ...newImages]);
    }

    if (req.files?.documents) {
      const existingProduct = db.prepare('SELECT documents FROM products WHERE id = ?').get(id);
      const existingDocs = JSON.parse(existingProduct?.documents || '[]');
      const newDocs = req.files.documents.map(f => `/uploads/documents/${f.filename}`);
      updates.documents = JSON.stringify([...existingDocs, ...newDocs]);
    }

    const fields = Object.keys(updates).map(key => `${key} = @${key}`).join(', ');
    const stmt = db.prepare(`UPDATE products SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`);

    stmt.run({ id, ...updates });
    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============== LEADS API ==============

// Get all leads
app.get('/api/leads', (req, res) => {
  try {
    const { partner_id, status, priority } = req.query;
    let query = `
      SELECT l.*,
        p.name as product_name,
        par.company_name as partner_name
      FROM leads l
      LEFT JOIN products p ON l.product_id = p.id
      LEFT JOIN partners par ON l.partner_id = par.id
      WHERE 1=1
    `;
    const params = [];

    if (partner_id) {
      query += ' AND l.partner_id = ?';
      params.push(partner_id);
    }
    if (status) {
      query += ' AND l.status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND l.priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY l.created_at DESC';

    const leads = db.prepare(query).all(...params);
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single lead
app.get('/api/leads/:id', (req, res) => {
  try {
    const lead = db.prepare(`
      SELECT l.*,
        p.name as product_name,
        par.company_name as partner_name
      FROM leads l
      LEFT JOIN products p ON l.product_id = p.id
      LEFT JOIN partners par ON l.partner_id = par.id
      WHERE l.id = ?
    `).get(req.params.id);

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Get activities
    const activities = db.prepare('SELECT * FROM lead_activities WHERE lead_id = ? ORDER BY created_at DESC').all(req.params.id);

    res.json({ ...lead, activities });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create lead
app.post('/api/leads', (req, res) => {
  try {
    const id = uuidv4();
    const lead = { id, ...req.body, status: req.body.status || 'new' };

    const stmt = db.prepare(`
      INSERT INTO leads (id, partner_id, product_id, customer_name, customer_email, customer_phone, customer_organization, customer_city, customer_state, requirement, budget_range, source, status, priority, notes)
      VALUES (@id, @partner_id, @product_id, @customer_name, @customer_email, @customer_phone, @customer_organization, @customer_city, @customer_state, @requirement, @budget_range, @source, @status, @priority, @notes)
    `);

    stmt.run(lead);

    // Add activity
    db.prepare(`
      INSERT INTO lead_activities (id, lead_id, activity_type, description, created_by)
      VALUES (?, ?, 'created', 'Lead created', 'System')
    `).run(uuidv4(), id);

    res.status(201).json({ id, message: 'Lead created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update lead
app.put('/api/leads/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Get current status for activity tracking
    const currentLead = db.prepare('SELECT status FROM leads WHERE id = ?').get(id);

    const fields = Object.keys(updates).map(key => `${key} = @${key}`).join(', ');
    const stmt = db.prepare(`UPDATE leads SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`);

    stmt.run({ id, ...updates });

    // Add activity if status changed
    if (updates.status && updates.status !== currentLead?.status) {
      db.prepare(`
        INSERT INTO lead_activities (id, lead_id, activity_type, description, created_by)
        VALUES (?, ?, 'status_change', ?, 'User')
      `).run(uuidv4(), id, `Status changed from ${currentLead?.status} to ${updates.status}`);
    }

    res.json({ message: 'Lead updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign lead to partner
app.post('/api/leads/:id/assign', (req, res) => {
  try {
    const { id } = req.params;
    const { partner_id } = req.body;

    db.prepare(`
      UPDATE leads SET partner_id = ?, assigned_at = CURRENT_TIMESTAMP, status = 'assigned', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(partner_id, id);

    const partner = db.prepare('SELECT company_name FROM partners WHERE id = ?').get(partner_id);

    db.prepare(`
      INSERT INTO lead_activities (id, lead_id, activity_type, description, created_by)
      VALUES (?, ?, 'assigned', ?, 'System')
    `).run(uuidv4(), id, `Lead assigned to ${partner?.company_name}`);

    res.json({ message: 'Lead assigned successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add activity to lead
app.post('/api/leads/:id/activities', (req, res) => {
  try {
    const { id } = req.params;
    const { activity_type, description, created_by } = req.body;

    const activityId = uuidv4();
    db.prepare(`
      INSERT INTO lead_activities (id, lead_id, activity_type, description, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(activityId, id, activity_type, description, created_by || 'User');

    res.status(201).json({ id: activityId, message: 'Activity added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete lead
app.delete('/api/leads/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM lead_activities WHERE lead_id = ?').run(req.params.id);
    db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============== DEALS API ==============

// Get all deals
app.get('/api/deals', (req, res) => {
  try {
    const { partner_id, status, payment_status } = req.query;
    let query = `
      SELECT d.*,
        l.customer_name, l.customer_organization,
        p.name as product_name,
        par.company_name as partner_name
      FROM deals d
      LEFT JOIN leads l ON d.lead_id = l.id
      LEFT JOIN products p ON d.product_id = p.id
      LEFT JOIN partners par ON d.partner_id = par.id
      WHERE 1=1
    `;
    const params = [];

    if (partner_id) {
      query += ' AND d.partner_id = ?';
      params.push(partner_id);
    }
    if (status) {
      query += ' AND d.status = ?';
      params.push(status);
    }
    if (payment_status) {
      query += ' AND d.payment_status = ?';
      params.push(payment_status);
    }

    query += ' ORDER BY d.created_at DESC';

    const deals = db.prepare(query).all(...params);
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single deal
app.get('/api/deals/:id', (req, res) => {
  try {
    const deal = db.prepare(`
      SELECT d.*,
        l.customer_name, l.customer_organization, l.customer_email, l.customer_phone,
        p.name as product_name,
        par.company_name as partner_name
      FROM deals d
      LEFT JOIN leads l ON d.lead_id = l.id
      LEFT JOIN products p ON d.product_id = p.id
      LEFT JOIN partners par ON d.partner_id = par.id
      WHERE d.id = ?
    `).get(req.params.id);

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    // Get transactions
    const transactions = db.prepare('SELECT * FROM transactions WHERE deal_id = ? ORDER BY created_at DESC').all(req.params.id);

    res.json({ ...deal, transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create deal
app.post('/api/deals', (req, res) => {
  try {
    const id = uuidv4();
    const commission_amount = (req.body.deal_value * (req.body.commission_rate || 10)) / 100;

    const deal = {
      id,
      ...req.body,
      commission_amount,
      status: req.body.status || 'negotiation'
    };

    const stmt = db.prepare(`
      INSERT INTO deals (id, lead_id, partner_id, product_id, deal_value, commission_rate, commission_amount, status, closure_date, payment_status, invoice_number, notes)
      VALUES (@id, @lead_id, @partner_id, @product_id, @deal_value, @commission_rate, @commission_amount, @status, @closure_date, @payment_status, @invoice_number, @notes)
    `);

    stmt.run(deal);

    // Update lead status
    if (req.body.lead_id) {
      db.prepare('UPDATE leads SET status = ? WHERE id = ?').run('deal_created', req.body.lead_id);
    }

    res.status(201).json({ id, message: 'Deal created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update deal
app.put('/api/deals/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Recalculate commission if deal value or rate changed
    if (updates.deal_value || updates.commission_rate) {
      const current = db.prepare('SELECT deal_value, commission_rate FROM deals WHERE id = ?').get(id);
      const dealValue = updates.deal_value || current.deal_value;
      const commissionRate = updates.commission_rate || current.commission_rate;
      updates.commission_amount = (dealValue * commissionRate) / 100;
    }

    const fields = Object.keys(updates).map(key => `${key} = @${key}`).join(', ');
    const stmt = db.prepare(`UPDATE deals SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`);

    stmt.run({ id, ...updates });

    // Update lead status if deal status changed
    if (updates.status === 'won') {
      const deal = db.prepare('SELECT lead_id FROM deals WHERE id = ?').get(id);
      if (deal?.lead_id) {
        db.prepare('UPDATE leads SET status = ? WHERE id = ?').run('converted', deal.lead_id);
      }
    }

    res.json({ message: 'Deal updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete deal
app.delete('/api/deals/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM transactions WHERE deal_id = ?').run(req.params.id);
    db.prepare('DELETE FROM deals WHERE id = ?').run(req.params.id);
    res.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============== TRANSACTIONS API ==============

// Get all transactions
app.get('/api/transactions', (req, res) => {
  try {
    const { partner_id, type, status } = req.query;
    let query = `
      SELECT t.*,
        d.deal_value, d.invoice_number,
        par.company_name as partner_name
      FROM transactions t
      LEFT JOIN deals d ON t.deal_id = d.id
      LEFT JOIN partners par ON t.partner_id = par.id
      WHERE 1=1
    `;
    const params = [];

    if (partner_id) {
      query += ' AND t.partner_id = ?';
      params.push(partner_id);
    }
    if (type) {
      query += ' AND t.type = ?';
      params.push(type);
    }
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    query += ' ORDER BY t.created_at DESC';

    const transactions = db.prepare(query).all(...params);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create transaction
app.post('/api/transactions', (req, res) => {
  try {
    const id = uuidv4();
    const transaction = { id, ...req.body, status: req.body.status || 'pending' };

    const stmt = db.prepare(`
      INSERT INTO transactions (id, deal_id, partner_id, type, amount, due_date, paid_date, status, payment_method, reference_number, notes)
      VALUES (@id, @deal_id, @partner_id, @type, @amount, @due_date, @paid_date, @status, @payment_method, @reference_number, @notes)
    `);

    stmt.run(transaction);
    res.status(201).json({ id, message: 'Transaction created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update transaction
app.put('/api/transactions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields = Object.keys(updates).map(key => `${key} = @${key}`).join(', ');
    const stmt = db.prepare(`UPDATE transactions SET ${fields} WHERE id = @id`);

    stmt.run({ id, ...updates });
    res.json({ message: 'Transaction updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============== DASHBOARD API ==============

// Get dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  try {
    const { partner_id } = req.query;

    let partnerFilter = '';
    const params = [];
    if (partner_id) {
      partnerFilter = 'WHERE partner_id = ?';
      params.push(partner_id);
    }

    // Partner stats
    const totalPartners = db.prepare('SELECT COUNT(*) as count FROM partners').get().count;
    const activePartners = db.prepare("SELECT COUNT(*) as count FROM partners WHERE status = 'active'").get().count;

    // Product stats
    const totalProducts = db.prepare(`SELECT COUNT(*) as count FROM products ${partnerFilter}`).get(...params).count;
    const publishedProducts = db.prepare(`SELECT COUNT(*) as count FROM products WHERE status = 'published' ${partner_id ? 'AND partner_id = ?' : ''}`).get(...params).count;

    // Lead stats
    const totalLeads = db.prepare(`SELECT COUNT(*) as count FROM leads ${partnerFilter}`).get(...params).count;
    const newLeads = db.prepare(`SELECT COUNT(*) as count FROM leads WHERE status = 'new' ${partner_id ? 'AND partner_id = ?' : ''}`).get(...params).count;
    const qualifiedLeads = db.prepare(`SELECT COUNT(*) as count FROM leads WHERE status IN ('qualified', 'contacted', 'negotiation') ${partner_id ? 'AND partner_id = ?' : ''}`).get(...params).count;
    const convertedLeads = db.prepare(`SELECT COUNT(*) as count FROM leads WHERE status = 'converted' ${partner_id ? 'AND partner_id = ?' : ''}`).get(...params).count;

    // Deal stats
    const totalDeals = db.prepare(`SELECT COUNT(*) as count FROM deals ${partnerFilter}`).get(...params).count;
    const wonDeals = db.prepare(`SELECT COUNT(*) as count FROM deals WHERE status = 'won' ${partner_id ? 'AND partner_id = ?' : ''}`).get(...params).count;
    const totalDealValue = db.prepare(`SELECT COALESCE(SUM(deal_value), 0) as total FROM deals WHERE status = 'won' ${partner_id ? 'AND partner_id = ?' : ''}`).get(...params).total;
    const totalCommission = db.prepare(`SELECT COALESCE(SUM(commission_amount), 0) as total FROM deals WHERE status = 'won' ${partner_id ? 'AND partner_id = ?' : ''}`).get(...params).total;

    // Transaction stats
    const pendingReceivables = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'receivable' AND status = 'pending' ${partner_id ? 'AND partner_id = ?' : ''}`).get(...params).total;
    const pendingPayables = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'payable' AND status = 'pending' ${partner_id ? 'AND partner_id = ?' : ''}`).get(...params).total;

    // Conversion rate
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;

    res.json({
      partners: { total: totalPartners, active: activePartners },
      products: { total: totalProducts, published: publishedProducts },
      leads: {
        total: totalLeads,
        new: newLeads,
        qualified: qualifiedLeads,
        converted: convertedLeads,
        conversionRate
      },
      deals: {
        total: totalDeals,
        won: wonDeals,
        totalValue: totalDealValue,
        totalCommission
      },
      financials: {
        pendingReceivables,
        pendingPayables
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get lead funnel data
app.get('/api/dashboard/funnel', (req, res) => {
  try {
    const { partner_id } = req.query;

    let partnerFilter = partner_id ? 'WHERE partner_id = ?' : '';
    const params = partner_id ? [partner_id] : [];

    const funnel = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM leads
      ${partnerFilter}
      GROUP BY status
    `).all(...params);

    const funnelMap = {
      new: 0,
      assigned: 0,
      contacted: 0,
      qualified: 0,
      negotiation: 0,
      deal_created: 0,
      converted: 0,
      lost: 0
    };

    funnel.forEach(item => {
      funnelMap[item.status] = item.count;
    });

    res.json(funnelMap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly trends
app.get('/api/dashboard/trends', (req, res) => {
  try {
    const { partner_id } = req.query;

    let partnerFilter = partner_id ? 'AND partner_id = ?' : '';
    const params = partner_id ? [partner_id, partner_id] : [];

    // Last 6 months leads trend
    const leadsTrend = db.prepare(`
      SELECT
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as leads
      FROM leads
      WHERE created_at >= date('now', '-6 months') ${partnerFilter}
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month
    `).all(...(partner_id ? [partner_id] : []));

    // Last 6 months deals trend
    const dealsTrend = db.prepare(`
      SELECT
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as deals,
        COALESCE(SUM(deal_value), 0) as value
      FROM deals
      WHERE created_at >= date('now', '-6 months') ${partnerFilter}
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month
    `).all(...(partner_id ? [partner_id] : []));

    res.json({ leadsTrend, dealsTrend });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent activities
app.get('/api/dashboard/activities', (req, res) => {
  try {
    const { partner_id, limit = 10 } = req.query;

    let partnerFilter = partner_id ? 'AND l.partner_id = ?' : '';
    const params = partner_id ? [partner_id, parseInt(limit)] : [parseInt(limit)];

    const activities = db.prepare(`
      SELECT la.*, l.customer_name, l.customer_organization
      FROM lead_activities la
      LEFT JOIN leads l ON la.lead_id = l.id
      WHERE 1=1 ${partnerFilter}
      ORDER BY la.created_at DESC
      LIMIT ?
    `).all(...params);

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get products by category
app.get('/api/dashboard/products-by-category', (req, res) => {
  try {
    const { partner_id } = req.query;

    let partnerFilter = partner_id ? 'WHERE partner_id = ?' : '';
    const params = partner_id ? [partner_id] : [];

    const categories = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM products
      ${partnerFilter}
      GROUP BY category
    `).all(...params);

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`3P Partner Portal API running on port ${PORT}`);
});
