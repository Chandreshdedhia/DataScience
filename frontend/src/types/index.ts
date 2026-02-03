export interface Partner {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gst_number?: string;
  pan_number?: string;
  bank_name?: string;
  bank_account?: string;
  ifsc_code?: string;
  specialization?: string;
  experience_years?: number;
  certifications?: string;
  status: 'pending' | 'active' | 'inactive' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  partner_id: string;
  partner_name?: string;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  year_of_manufacture?: number;
  condition?: string;
  price: number;
  description?: string;
  specifications?: string;
  warranty_months?: number;
  images?: string;
  documents?: string;
  status: 'draft' | 'pending' | 'published' | 'sold' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  partner_id?: string;
  partner_name?: string;
  product_id?: string;
  product_name?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_organization?: string;
  customer_city?: string;
  customer_state?: string;
  requirement?: string;
  budget_range?: string;
  source: string;
  status: 'new' | 'assigned' | 'contacted' | 'qualified' | 'negotiation' | 'deal_created' | 'converted' | 'lost';
  priority: 'low' | 'medium' | 'high';
  assigned_at?: string;
  contacted_at?: string;
  notes?: string;
  activities?: LeadActivity[];
  created_at: string;
  updated_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: string;
  description?: string;
  created_by?: string;
  created_at: string;
}

export interface Deal {
  id: string;
  lead_id: string;
  partner_id: string;
  partner_name?: string;
  product_id?: string;
  product_name?: string;
  customer_name?: string;
  customer_organization?: string;
  customer_email?: string;
  customer_phone?: string;
  deal_value: number;
  commission_rate: number;
  commission_amount: number;
  status: 'negotiation' | 'won' | 'lost' | 'cancelled';
  closure_date?: string;
  payment_status: 'pending' | 'partial' | 'paid';
  invoice_number?: string;
  notes?: string;
  transactions?: Transaction[];
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  deal_id: string;
  partner_id: string;
  partner_name?: string;
  type: 'receivable' | 'payable';
  amount: number;
  due_date?: string;
  paid_date?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  deal_value?: number;
  invoice_number?: string;
  created_at: string;
}

export interface DashboardStats {
  partners: {
    total: number;
    active: number;
  };
  products: {
    total: number;
    published: number;
  };
  leads: {
    total: number;
    new: number;
    qualified: number;
    converted: number;
    conversionRate: number;
  };
  deals: {
    total: number;
    won: number;
    totalValue: number;
    totalCommission: number;
  };
  financials: {
    pendingReceivables: number;
    pendingPayables: number;
  };
}

export interface LeadFunnel {
  new: number;
  assigned: number;
  contacted: number;
  qualified: number;
  negotiation: number;
  deal_created: number;
  converted: number;
  lost: number;
}
