const API_BASE = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An error occurred' }));
    throw new Error(error.error || 'An error occurred');
  }
  return response.json();
}

export const api = {
  // Partners
  getPartners: () =>
    fetch(`${API_BASE}/partners`).then(handleResponse<any[]>),

  getPartner: (id: string) =>
    fetch(`${API_BASE}/partners/${id}`).then(handleResponse<any>),

  createPartner: (data: any) =>
    fetch(`${API_BASE}/partners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse<any>),

  updatePartner: (id: string, data: any) =>
    fetch(`${API_BASE}/partners/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse<any>),

  deletePartner: (id: string) =>
    fetch(`${API_BASE}/partners/${id}`, { method: 'DELETE' }).then(handleResponse<any>),

  // Products
  getProducts: (params?: { partner_id?: string; status?: string; category?: string }) => {
    const searchParams = new URLSearchParams(params as Record<string, string>);
    return fetch(`${API_BASE}/products?${searchParams}`).then(handleResponse<any[]>);
  },

  getProduct: (id: string) =>
    fetch(`${API_BASE}/products/${id}`).then(handleResponse<any>),

  createProduct: (formData: FormData) =>
    fetch(`${API_BASE}/products`, {
      method: 'POST',
      body: formData
    }).then(handleResponse<any>),

  updateProduct: (id: string, formData: FormData) =>
    fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      body: formData
    }).then(handleResponse<any>),

  deleteProduct: (id: string) =>
    fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' }).then(handleResponse<any>),

  // Leads
  getLeads: (params?: { partner_id?: string; status?: string; priority?: string }) => {
    const searchParams = new URLSearchParams(params as Record<string, string>);
    return fetch(`${API_BASE}/leads?${searchParams}`).then(handleResponse<any[]>);
  },

  getLead: (id: string) =>
    fetch(`${API_BASE}/leads/${id}`).then(handleResponse<any>),

  createLead: (data: any) =>
    fetch(`${API_BASE}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse<any>),

  updateLead: (id: string, data: any) =>
    fetch(`${API_BASE}/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse<any>),

  assignLead: (id: string, partner_id: string) =>
    fetch(`${API_BASE}/leads/${id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partner_id })
    }).then(handleResponse<any>),

  addLeadActivity: (id: string, data: { activity_type: string; description: string }) =>
    fetch(`${API_BASE}/leads/${id}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse<any>),

  deleteLead: (id: string) =>
    fetch(`${API_BASE}/leads/${id}`, { method: 'DELETE' }).then(handleResponse<any>),

  // Deals
  getDeals: (params?: { partner_id?: string; status?: string; payment_status?: string }) => {
    const searchParams = new URLSearchParams(params as Record<string, string>);
    return fetch(`${API_BASE}/deals?${searchParams}`).then(handleResponse<any[]>);
  },

  getDeal: (id: string) =>
    fetch(`${API_BASE}/deals/${id}`).then(handleResponse<any>),

  createDeal: (data: any) =>
    fetch(`${API_BASE}/deals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse<any>),

  updateDeal: (id: string, data: any) =>
    fetch(`${API_BASE}/deals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse<any>),

  deleteDeal: (id: string) =>
    fetch(`${API_BASE}/deals/${id}`, { method: 'DELETE' }).then(handleResponse<any>),

  // Transactions
  getTransactions: (params?: { partner_id?: string; type?: string; status?: string }) => {
    const searchParams = new URLSearchParams(params as Record<string, string>);
    return fetch(`${API_BASE}/transactions?${searchParams}`).then(handleResponse<any[]>);
  },

  createTransaction: (data: any) =>
    fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse<any>),

  updateTransaction: (id: string, data: any) =>
    fetch(`${API_BASE}/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse<any>),

  // Dashboard
  getDashboardStats: (partner_id?: string) => {
    const params = partner_id ? `?partner_id=${partner_id}` : '';
    return fetch(`${API_BASE}/dashboard/stats${params}`).then(handleResponse<any>);
  },

  getLeadFunnel: (partner_id?: string) => {
    const params = partner_id ? `?partner_id=${partner_id}` : '';
    return fetch(`${API_BASE}/dashboard/funnel${params}`).then(handleResponse<any>);
  },

  getTrends: (partner_id?: string) => {
    const params = partner_id ? `?partner_id=${partner_id}` : '';
    return fetch(`${API_BASE}/dashboard/trends${params}`).then(handleResponse<any>);
  },

  getRecentActivities: (partner_id?: string, limit = 10) => {
    let params = `?limit=${limit}`;
    if (partner_id) params += `&partner_id=${partner_id}`;
    return fetch(`${API_BASE}/dashboard/activities${params}`).then(handleResponse<any[]>);
  },

  getProductsByCategory: (partner_id?: string) => {
    const params = partner_id ? `?partner_id=${partner_id}` : '';
    return fetch(`${API_BASE}/dashboard/products-by-category${params}`).then(handleResponse<any[]>);
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
