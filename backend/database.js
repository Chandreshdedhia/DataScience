const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'portal.db'));

// Initialize database schema
db.exec(`
  -- Partners table
  CREATE TABLE IF NOT EXISTS partners (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    gst_number TEXT,
    pan_number TEXT,
    bank_name TEXT,
    bank_account TEXT,
    ifsc_code TEXT,
    specialization TEXT,
    experience_years INTEGER,
    certifications TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Products table
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    partner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    year_of_manufacture INTEGER,
    condition TEXT,
    price REAL NOT NULL,
    description TEXT,
    specifications TEXT,
    warranty_months INTEGER,
    images TEXT,
    documents TEXT,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (partner_id) REFERENCES partners(id)
  );

  -- Leads table
  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    partner_id TEXT,
    product_id TEXT,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_organization TEXT,
    customer_city TEXT,
    customer_state TEXT,
    requirement TEXT,
    budget_range TEXT,
    source TEXT DEFAULT 'marketplace',
    status TEXT DEFAULT 'new',
    priority TEXT DEFAULT 'medium',
    assigned_at DATETIME,
    contacted_at DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (partner_id) REFERENCES partners(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  -- Deals table
  CREATE TABLE IF NOT EXISTS deals (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL,
    partner_id TEXT NOT NULL,
    product_id TEXT,
    deal_value REAL NOT NULL,
    commission_rate REAL DEFAULT 10,
    commission_amount REAL,
    status TEXT DEFAULT 'negotiation',
    closure_date DATE,
    payment_status TEXT DEFAULT 'pending',
    invoice_number TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id),
    FOREIGN KEY (partner_id) REFERENCES partners(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  -- Transactions table (Payables/Receivables)
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    deal_id TEXT NOT NULL,
    partner_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    due_date DATE,
    paid_date DATE,
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    reference_number TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deal_id) REFERENCES deals(id),
    FOREIGN KEY (partner_id) REFERENCES partners(id)
  );

  -- Lead Activities table
  CREATE TABLE IF NOT EXISTS lead_activities (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    description TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id)
  );
`);

// Insert sample data if tables are empty
const partnerCount = db.prepare('SELECT COUNT(*) as count FROM partners').get();

if (partnerCount.count === 0) {
  const { v4: uuidv4 } = require('uuid');

  // Sample Partners
  const partners = [
    {
      id: uuidv4(),
      company_name: 'MedEquip Solutions Pvt Ltd',
      contact_person: 'Rajesh Kumar',
      email: 'rajesh@medequip.com',
      phone: '+91 98765 43210',
      address: '123, Industrial Area, Phase 2',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      gst_number: '27AABCU9603R1ZM',
      pan_number: 'AABCU9603R',
      bank_name: 'HDFC Bank',
      bank_account: '12345678901234',
      ifsc_code: 'HDFC0001234',
      specialization: 'X-Ray, CT Scan, MRI',
      experience_years: 15,
      certifications: 'ISO 13485, CE Certified',
      status: 'active'
    },
    {
      id: uuidv4(),
      company_name: 'DiagnoTech Refurbished',
      contact_person: 'Priya Sharma',
      email: 'priya@diagnotech.in',
      phone: '+91 87654 32109',
      address: '456, Tech Park, Sector 5',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      gst_number: '07AABCU9603R1ZM',
      pan_number: 'AABCU9604R',
      bank_name: 'ICICI Bank',
      bank_account: '23456789012345',
      ifsc_code: 'ICIC0001234',
      specialization: 'CT Scan, Ultrasound',
      experience_years: 10,
      certifications: 'ISO 9001, FDA Registered',
      status: 'active'
    }
  ];

  const insertPartner = db.prepare(`
    INSERT INTO partners (id, company_name, contact_person, email, phone, address, city, state, pincode, gst_number, pan_number, bank_name, bank_account, ifsc_code, specialization, experience_years, certifications, status)
    VALUES (@id, @company_name, @contact_person, @email, @phone, @address, @city, @state, @pincode, @gst_number, @pan_number, @bank_name, @bank_account, @ifsc_code, @specialization, @experience_years, @certifications, @status)
  `);

  partners.forEach(partner => insertPartner.run(partner));

  // Sample Products
  const products = [
    {
      id: uuidv4(),
      partner_id: partners[0].id,
      name: 'Siemens Somatom Definition AS 64-Slice CT Scanner',
      category: 'CT Scanner',
      brand: 'Siemens',
      model: 'Somatom Definition AS',
      year_of_manufacture: 2019,
      condition: 'Excellent',
      price: 4500000,
      description: 'Refurbished 64-slice CT scanner with advanced cardiac imaging capabilities. Includes syngo.via software package.',
      specifications: JSON.stringify({
        slices: '64',
        rotation_time: '0.33s',
        power: '80kW',
        tube_heat_capacity: '30 MHU'
      }),
      warranty_months: 12,
      images: JSON.stringify([]),
      documents: JSON.stringify([]),
      status: 'published'
    },
    {
      id: uuidv4(),
      partner_id: partners[0].id,
      name: 'GE Optima XR646 Digital X-Ray System',
      category: 'X-Ray',
      brand: 'GE Healthcare',
      model: 'Optima XR646',
      year_of_manufacture: 2020,
      condition: 'Excellent',
      price: 1800000,
      description: 'Fully digital radiography system with advanced image processing. Ideal for high-volume facilities.',
      specifications: JSON.stringify({
        detector_size: '43x43 cm',
        resolution: '3.2 lp/mm',
        generator_power: '65kW',
        tube_capacity: '600 kHU'
      }),
      warranty_months: 12,
      images: JSON.stringify([]),
      documents: JSON.stringify([]),
      status: 'published'
    },
    {
      id: uuidv4(),
      partner_id: partners[1].id,
      name: 'Philips Brilliance iCT 256-Slice CT Scanner',
      category: 'CT Scanner',
      brand: 'Philips',
      model: 'Brilliance iCT',
      year_of_manufacture: 2018,
      condition: 'Good',
      price: 7500000,
      description: 'High-end 256-slice CT scanner suitable for advanced cardiac and neurological imaging.',
      specifications: JSON.stringify({
        slices: '256',
        rotation_time: '0.27s',
        power: '120kW',
        coverage: '8cm per rotation'
      }),
      warranty_months: 6,
      images: JSON.stringify([]),
      documents: JSON.stringify([]),
      status: 'published'
    }
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (id, partner_id, name, category, brand, model, year_of_manufacture, condition, price, description, specifications, warranty_months, images, documents, status)
    VALUES (@id, @partner_id, @name, @category, @brand, @model, @year_of_manufacture, @condition, @price, @description, @specifications, @warranty_months, @images, @documents, @status)
  `);

  products.forEach(product => insertProduct.run(product));

  // Sample Leads
  const leads = [
    {
      id: uuidv4(),
      partner_id: partners[0].id,
      product_id: products[0].id,
      customer_name: 'Dr. Amit Patel',
      customer_email: 'amit.patel@cityhospital.com',
      customer_phone: '+91 99887 76655',
      customer_organization: 'City General Hospital',
      customer_city: 'Ahmedabad',
      customer_state: 'Gujarat',
      requirement: 'Looking for 64-slice CT scanner for new radiology wing',
      budget_range: '40-50 Lakhs',
      source: 'marketplace',
      status: 'qualified',
      priority: 'high',
      notes: 'Urgent requirement, decision expected within 2 weeks'
    },
    {
      id: uuidv4(),
      partner_id: partners[0].id,
      product_id: products[1].id,
      customer_name: 'Dr. Sneha Reddy',
      customer_email: 'sneha@healthclinic.in',
      customer_phone: '+91 88776 65544',
      customer_organization: 'Health First Clinic',
      customer_city: 'Hyderabad',
      customer_state: 'Telangana',
      requirement: 'Digital X-Ray system for diagnostic center',
      budget_range: '15-20 Lakhs',
      source: 'marketplace',
      status: 'contacted',
      priority: 'medium',
      notes: 'Interested in demo'
    },
    {
      id: uuidv4(),
      partner_id: partners[1].id,
      product_id: products[2].id,
      customer_name: 'Mr. Vikram Singh',
      customer_email: 'vikram@metrohealthcare.com',
      customer_phone: '+91 77665 54433',
      customer_organization: 'Metro Healthcare Pvt Ltd',
      customer_city: 'Bangalore',
      customer_state: 'Karnataka',
      requirement: 'High-end CT scanner for multi-specialty hospital',
      budget_range: '70-80 Lakhs',
      source: 'referral',
      status: 'negotiation',
      priority: 'high',
      notes: 'Comparing with competitor offerings'
    },
    {
      id: uuidv4(),
      partner_id: null,
      product_id: null,
      customer_name: 'Dr. Kavita Joshi',
      customer_email: 'kavita@sunrise.com',
      customer_phone: '+91 66554 43322',
      customer_organization: 'Sunrise Diagnostics',
      customer_city: 'Pune',
      customer_state: 'Maharashtra',
      requirement: 'Refurbished CT or X-Ray equipment',
      budget_range: '20-30 Lakhs',
      source: 'website',
      status: 'new',
      priority: 'medium',
      notes: ''
    }
  ];

  const insertLead = db.prepare(`
    INSERT INTO leads (id, partner_id, product_id, customer_name, customer_email, customer_phone, customer_organization, customer_city, customer_state, requirement, budget_range, source, status, priority, notes)
    VALUES (@id, @partner_id, @product_id, @customer_name, @customer_email, @customer_phone, @customer_organization, @customer_city, @customer_state, @requirement, @budget_range, @source, @status, @priority, @notes)
  `);

  leads.forEach(lead => insertLead.run(lead));

  // Sample Deals
  const deals = [
    {
      id: uuidv4(),
      lead_id: leads[0].id,
      partner_id: partners[0].id,
      product_id: products[0].id,
      deal_value: 4200000,
      commission_rate: 10,
      commission_amount: 420000,
      status: 'won',
      closure_date: '2024-01-15',
      payment_status: 'partial',
      invoice_number: 'INV-2024-001',
      notes: 'Final negotiated price after discount'
    },
    {
      id: uuidv4(),
      lead_id: leads[2].id,
      partner_id: partners[1].id,
      product_id: products[2].id,
      deal_value: 7200000,
      commission_rate: 8,
      commission_amount: 576000,
      status: 'negotiation',
      closure_date: null,
      payment_status: 'pending',
      invoice_number: null,
      notes: 'Customer requesting additional warranty'
    }
  ];

  const insertDeal = db.prepare(`
    INSERT INTO deals (id, lead_id, partner_id, product_id, deal_value, commission_rate, commission_amount, status, closure_date, payment_status, invoice_number, notes)
    VALUES (@id, @lead_id, @partner_id, @product_id, @deal_value, @commission_rate, @commission_amount, @status, @closure_date, @payment_status, @invoice_number, @notes)
  `);

  deals.forEach(deal => insertDeal.run(deal));

  // Sample Transactions
  const transactions = [
    {
      id: uuidv4(),
      deal_id: deals[0].id,
      partner_id: partners[0].id,
      type: 'receivable',
      amount: 2100000,
      due_date: '2024-01-30',
      paid_date: '2024-01-28',
      status: 'paid',
      payment_method: 'Bank Transfer',
      reference_number: 'TXN-2024-001',
      notes: 'First installment received'
    },
    {
      id: uuidv4(),
      deal_id: deals[0].id,
      partner_id: partners[0].id,
      type: 'receivable',
      amount: 2100000,
      due_date: '2024-02-28',
      paid_date: null,
      status: 'pending',
      payment_method: null,
      reference_number: null,
      notes: 'Second installment pending'
    },
    {
      id: uuidv4(),
      deal_id: deals[0].id,
      partner_id: partners[0].id,
      type: 'payable',
      amount: 420000,
      due_date: '2024-03-15',
      paid_date: null,
      status: 'pending',
      payment_method: null,
      reference_number: null,
      notes: 'Commission payable to Medikabazaar'
    }
  ];

  const insertTransaction = db.prepare(`
    INSERT INTO transactions (id, deal_id, partner_id, type, amount, due_date, paid_date, status, payment_method, reference_number, notes)
    VALUES (@id, @deal_id, @partner_id, @type, @amount, @due_date, @paid_date, @status, @payment_method, @reference_number, @notes)
  `);

  transactions.forEach(transaction => insertTransaction.run(transaction));

  console.log('Sample data inserted successfully');
}

module.exports = db;
