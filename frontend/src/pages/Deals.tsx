import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Handshake,
  Building2,
  IndianRupee,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { api, formatCurrency, formatDate } from '../utils/api';
import type { Deal, Lead, Partner, Product } from '../types';

export default function Deals() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    lead_id: '',
    partner_id: '',
    product_id: '',
    deal_value: '',
    commission_rate: '10',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true);
      const leadId = searchParams.get('lead_id');
      if (leadId) {
        setCreateForm(prev => ({ ...prev, lead_id: leadId }));
      }
    }
  }, []);

  const loadData = async () => {
    try {
      const [dealsData, leadsData, partnersData, productsData] = await Promise.all([
        api.getDeals(),
        api.getLeads(),
        api.getPartners(),
        api.getProducts()
      ]);
      setDeals(dealsData);
      setLeads(leadsData.filter((l: Lead) => ['qualified', 'negotiation', 'deal_created'].includes(l.status)));
      setPartners(partnersData.filter((p: Partner) => p.status === 'active'));
      setProducts(productsData.filter((p: Product) => p.status === 'published'));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.updateDeal(id, { status });
      loadData();
      setOpenMenu(null);
    } catch (error) {
      console.error('Error updating deal:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this deal?')) return;
    try {
      await api.deleteDeal(id);
      loadData();
    } catch (error) {
      console.error('Error deleting deal:', error);
    }
  };

  const handleCreateDeal = async () => {
    if (!createForm.lead_id || !createForm.partner_id || !createForm.deal_value) return;
    setSaving(true);
    try {
      await api.createDeal({
        lead_id: createForm.lead_id,
        partner_id: createForm.partner_id,
        product_id: createForm.product_id || null,
        deal_value: parseFloat(createForm.deal_value),
        commission_rate: parseFloat(createForm.commission_rate),
        notes: createForm.notes,
        status: 'negotiation',
        payment_status: 'pending'
      });
      setShowCreateModal(false);
      setCreateForm({
        lead_id: '',
        partner_id: '',
        product_id: '',
        deal_value: '',
        commission_rate: '10',
        notes: ''
      });
      loadData();
    } catch (error) {
      console.error('Error creating deal:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'won':
        return <span className="badge badge-success"><CheckCircle className="w-3 h-3 mr-1" />Won</span>;
      case 'negotiation':
        return <span className="badge badge-warning"><TrendingUp className="w-3 h-3 mr-1" />Negotiation</span>;
      case 'lost':
        return <span className="badge badge-danger"><XCircle className="w-3 h-3 mr-1" />Lost</span>;
      case 'cancelled':
        return <span className="badge badge-gray"><XCircle className="w-3 h-3 mr-1" />Cancelled</span>;
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="badge badge-success"><CheckCircle className="w-3 h-3 mr-1" />Paid</span>;
      case 'partial':
        return <span className="badge badge-warning"><Clock className="w-3 h-3 mr-1" />Partial</span>;
      case 'pending':
        return <span className="badge badge-gray"><Clock className="w-3 h-3 mr-1" />Pending</span>;
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.customer_organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.partner_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || deal.status === statusFilter;
    const matchesPayment = !paymentFilter || deal.payment_status === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Stats
  const totalValue = deals.filter(d => d.status === 'won').reduce((sum, d) => sum + d.deal_value, 0);
  const totalCommission = deals.filter(d => d.status === 'won').reduce((sum, d) => sum + d.commission_amount, 0);
  const wonDeals = deals.filter(d => d.status === 'won').length;
  const activeDeals = deals.filter(d => d.status === 'negotiation').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track deal closures and manage transactions
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          Create Deal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Deal Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Commission Earned</p>
              <p className="text-2xl font-bold text-primary-600">{formatCurrency(totalCommission)}</p>
            </div>
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Won Deals</p>
              <p className="text-2xl font-bold text-gray-900">{wonDeals}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Deals</p>
              <p className="text-2xl font-bold text-yellow-600">{activeDeals}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search deals..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none bg-white"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="">All Payments</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Partner
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Deal Value
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Commission
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Payment
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDeals.map((deal) => (
                <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{deal.customer_name}</p>
                      {deal.customer_organization && (
                        <p className="text-sm text-gray-500">{deal.customer_organization}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-primary-600" />
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        {deal.partner_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{formatCurrency(deal.deal_value)}</p>
                    {deal.product_name && (
                      <p className="text-xs text-gray-500">{deal.product_name}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-green-600">{formatCurrency(deal.commission_amount)}</p>
                    <p className="text-xs text-gray-500">{deal.commission_rate}% rate</p>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(deal.status)}
                  </td>
                  <td className="px-6 py-4">
                    {getPaymentBadge(deal.payment_status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === deal.id ? null : deal.id)}
                        className="p-2 rounded-lg hover:bg-gray-100"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                      </button>
                      {openMenu === deal.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                          <button
                            onClick={() => {
                              navigate(`/deals/${deal.id}`);
                              setOpenMenu(null);
                            }}
                            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </button>
                          {deal.status === 'negotiation' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(deal.id, 'won')}
                                className="w-full flex items-center px-4 py-2 text-sm text-green-600 hover:bg-gray-50"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark as Won
                              </button>
                              <button
                                onClick={() => handleStatusChange(deal.id, 'lost')}
                                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Mark as Lost
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              handleDelete(deal.id);
                              setOpenMenu(null);
                            }}
                            className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDeals.length === 0 && (
          <div className="text-center py-12">
            <Handshake className="w-12 h-12 mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No deals found</h3>
            <p className="mt-2 text-gray-500">Create your first deal to get started.</p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary mt-4">
              <Plus className="w-5 h-5 mr-2" />
              Create Deal
            </button>
          </div>
        )}
      </div>

      {/* Create Deal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Deal</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lead *</label>
                <select
                  value={createForm.lead_id}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, lead_id: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">Select Lead</option>
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id}>
                      {lead.customer_name} - {lead.customer_organization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Partner *</label>
                <select
                  value={createForm.partner_id}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, partner_id: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">Select Partner</option>
                  {partners.map(partner => (
                    <option key={partner.id} value={partner.id}>
                      {partner.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select
                  value={createForm.product_id}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, product_id: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">Select Product (Optional)</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {formatCurrency(product.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deal Value *</label>
                  <input
                    type="number"
                    value={createForm.deal_value}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, deal_value: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none"
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission %</label>
                  <input
                    type="number"
                    value={createForm.commission_rate}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, commission_rate: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none"
                    placeholder="10"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {createForm.deal_value && createForm.commission_rate && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Estimated Commission</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(parseFloat(createForm.deal_value) * parseFloat(createForm.commission_rate) / 100)}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  placeholder="Add any notes..."
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDeal}
                disabled={saving || !createForm.lead_id || !createForm.partner_id || !createForm.deal_value}
                className="flex-1 btn btn-primary"
              >
                {saving ? 'Creating...' : 'Create Deal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
