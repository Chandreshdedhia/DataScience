# Medikabazaar 3P Partner Portal

A professional portal for managing third-party refurbished medical equipment partners. This platform enables Medikabazaar to onboard partners, manage product catalogs, track leads from generation to conversion, and handle deal closures with complete financial tracking.

## Features

### Partner Management
- **Onboarding**: Multi-step partner registration with company details, documents (GST, PAN), bank information, and certifications
- **Status Management**: Track partner status (pending, active, inactive, rejected)
- **Partner Directory**: Searchable list of all partners with filtering options

### Product Catalog
- **Product Listing**: Add refurbished X-Ray, CT Scanner, MRI, and other medical equipment
- **Rich Details**: Brand, model, year of manufacture, condition, pricing, warranty
- **Media Upload**: Product images and technical documents
- **Technical Specifications**: Detailed specs for each product
- **Status Workflow**: Draft -> Pending -> Published -> Sold/Archived

### Lead Management
- **Lead Tracking**: Complete journey from new lead to conversion
- **Visual Funnel**: See leads progress through stages
- **Partner Assignment**: Assign leads to appropriate 3P partners
- **Activity Timeline**: Track all interactions and status changes
- **Priority Management**: High/Medium/Low priority classification

### Deal Management
- **Deal Creation**: Convert qualified leads into deals
- **Commission Tracking**: Automatic commission calculation
- **Status Tracking**: Negotiation -> Won/Lost
- **Customer Information**: Complete customer details linked to deals

### Financial Tracking
- **Receivables**: Track incoming payments from customers
- **Payables**: Track commission payments to platform
- **Transaction Management**: Due dates, payment status, payment recording
- **Financial Dashboard**: Overview of all pending and completed transactions

### Dashboard
- **Analytics Overview**: Key metrics at a glance
- **Lead Funnel Visualization**: See conversion journey
- **Revenue Tracking**: Total deal value and commission earned
- **Pending Actions**: New leads, pending payments
- **Recent Activity**: Timeline of recent actions

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Recharts** for data visualization
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **SQLite** with better-sqlite3 (easily migratable to PostgreSQL)
- **Multer** for file uploads
- **UUID** for unique identifiers

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd DataScience
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm start
```
The API will be available at `http://localhost:3001`

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```
The application will be available at `http://localhost:3000`

## Project Structure

```
.
├── backend/
│   ├── server.js        # Express API server
│   ├── database.js      # SQLite database setup & schema
│   ├── package.json
│   └── uploads/         # Uploaded files (images, documents)
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   │   └── Layout.tsx
│   │   ├── pages/       # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Partners.tsx
│   │   │   ├── PartnerForm.tsx
│   │   │   ├── Products.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── Leads.tsx
│   │   │   ├── LeadDetail.tsx
│   │   │   ├── Deals.tsx
│   │   │   ├── DealDetail.tsx
│   │   │   └── Financials.tsx
│   │   ├── types/       # TypeScript interfaces
│   │   ├── utils/       # Utility functions & API
│   │   ├── App.tsx      # Main app with routing
│   │   ├── main.tsx     # Entry point
│   │   └── index.css    # Global styles
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

## API Endpoints

### Partners
- `GET /api/partners` - List all partners
- `GET /api/partners/:id` - Get partner details
- `POST /api/partners` - Create new partner
- `PUT /api/partners/:id` - Update partner
- `DELETE /api/partners/:id` - Delete partner

### Products
- `GET /api/products` - List products (with filters)
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (multipart/form-data)
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Leads
- `GET /api/leads` - List leads (with filters)
- `GET /api/leads/:id` - Get lead with activities
- `POST /api/leads` - Create lead
- `PUT /api/leads/:id` - Update lead
- `POST /api/leads/:id/assign` - Assign lead to partner
- `POST /api/leads/:id/activities` - Add activity to lead
- `DELETE /api/leads/:id` - Delete lead

### Deals
- `GET /api/deals` - List deals (with filters)
- `GET /api/deals/:id` - Get deal with transactions
- `POST /api/deals` - Create deal
- `PUT /api/deals/:id` - Update deal
- `DELETE /api/deals/:id` - Delete deal

### Transactions
- `GET /api/transactions` - List transactions (with filters)
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/funnel` - Get lead funnel data
- `GET /api/dashboard/trends` - Get monthly trends
- `GET /api/dashboard/activities` - Get recent activities
- `GET /api/dashboard/products-by-category` - Get product distribution

## Business Flow

1. **Partner Onboarding**
   - Partner fills company details form
   - Uploads required documents
   - Admin reviews and activates partner

2. **Product Catalog**
   - Partner uploads product catalog
   - Adds images and technical documents
   - Products are published on Medikabazaar marketplace

3. **Lead Generation**
   - Leads generated from marketplace
   - Leads assigned to appropriate partners
   - Partners contact and qualify leads

4. **Deal Closure**
   - Qualified leads converted to deals
   - Negotiation and deal finalization
   - Deal marked as won/lost

5. **Financial Tracking**
   - Receivables tracked for customer payments
   - Payables tracked for commission payments
   - Complete financial visibility

## License

Proprietary - Medikabazaar
