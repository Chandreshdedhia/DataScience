import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Users,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Target,
  Filter,
  MoreVertical,
  UserPlus,
  Trash2,
  Eye,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { api, formatDate, formatCurrency } from '../utils/api';
import type { Lead, Partner } from '../types';

const statusSteps = [
  { key: 'new', label: 'New', color: 'bg-blue-500' },
  { key: 'assigned', label: 'Assigned', color: 'bg-purple-500' },
  { key: 'contacted', label: 'Contacted', color: 'bg-yellow-500' },
  { key: 'qualified', label: 'Qualified', color: 'bg-orange-500' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-pink-500' },
  { key: 'deal_created', label: 'Deal Created', color: 'bg-indigo-500' },
  { key: 'converted', label: 'Converted', color: 'bg-green-500' },
  { key: 'lost', label: 'Lost', color: 'bg-red-500' }
];

export default function Leads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<{ leadId: string; open: boolean }>({ leadId: '', open: false });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [leadsData, partnersData] = await Promise.all([
        api.getLeads(),
        api.getPartners()
      ]);
      setLeads(leadsData);
      setPartners(partnersData.filter((p: Partner) => p.status === 'active'));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.updateLead(id, { status });
      loadData();
      setOpenMenu(null);
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const handleAssign = async (leadId: string, partnerId: string) => {
    try {
      await api.assignLead(leadId, partnerId);
      loadData();
      setAssignModal({ leadId: '', open: false });
    } catch (error) {
      console.error('Error assigning lead:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      await api.deleteLead(id);
      loadData();
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { class: string; icon: any }> = {
      new: { class: 'badge-info', icon: AlertCircle },
      assigned: { class: 'badge-info', icon: UserPlus },
      contacted: { class: 'badge-warning', icon: Phone },
      qualified: { class: 'badge-warning', icon: CheckCircle },
      negotiation: { class: 'badge-warning', icon: Target },
      deal_created: { class: 'badge-info', icon: Target },
      converted: { class: 'badge-success', icon: CheckCircle },
      lost: { class: 'badge-danger', icon: AlertCircle }
    };

    const config = statusConfig[status] || { class: 'badge-gray', icon: Clock };
    const Icon = config.icon;

    return (
      <span className={`badge ${config.class}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">High</span>;
      case 'medium':
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">Medium</span>;
      case 'low':
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">Low</span>;
      default:
        return null;
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.customer_organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || lead.status === statusFilter;
    const matchesPriority = !priorityFilter || lead.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Group leads by status for kanban view
  const leadsByStatus = statusSteps.reduce((acc, step) => {
    acc[step.key] = filteredLeads.filter(l => l.status === step.key);
    return acc;
  }, {} as Record<string, Lead[]>);

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
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage customer leads from generation to conversion
          </p>
        </div>
      </div>

      {/* Lead Journey Overview */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 overflow-x-auto">
        <div className="flex items-center min-w-max">
          {statusSteps.map((step, index) => {
            const count = leadsByStatus[step.key]?.length || 0;
            return (
              <div key={step.key} className="flex items-center">
                <button
                  onClick={() => setStatusFilter(statusFilter === step.key ? '' : step.key)}
                  className={`flex flex-col items-center px-4 py-2 rounded-lg transition-colors ${
                    statusFilter === step.key ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-10 h-10 ${step.color} rounded-full flex items-center justify-center text-white font-bold`}>
                    {count}
                  </div>
                  <span className="mt-1 text-xs font-medium text-gray-600">{step.label}</span>
                </button>
                {index < statusSteps.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-gray-300 mx-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
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
            {statusSteps.map(step => (
              <option key={step.key} value={step.key}>{step.label}</option>
            ))}
          </select>

          <select
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none bg-white"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Leads List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Product Interest
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{lead.customer_name}</p>
                      {lead.customer_organization && (
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <Building2 className="w-3 h-3 mr-1" />
                          {lead.customer_organization}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 flex items-center">
                        <Mail className="w-3 h-3 mr-1 text-gray-400" />
                        {lead.customer_email}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Phone className="w-3 h-3 mr-1 text-gray-400" />
                        {lead.customer_phone}
                      </p>
                      {lead.customer_city && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                          {lead.customer_city}, {lead.customer_state}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      {lead.product_name ? (
                        <p className="text-sm font-medium text-gray-900">{lead.product_name}</p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Not specified</p>
                      )}
                      {lead.budget_range && (
                        <p className="text-xs text-gray-500 mt-1">Budget: {lead.budget_range}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {lead.partner_name ? (
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-primary-600" />
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-700">{lead.partner_name}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAssignModal({ leadId: lead.id, open: true })}
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Assign Partner
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(lead.status)}
                  </td>
                  <td className="px-6 py-4">
                    {getPriorityBadge(lead.priority)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === lead.id ? null : lead.id)}
                        className="p-2 rounded-lg hover:bg-gray-100"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                      </button>
                      {openMenu === lead.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                          <button
                            onClick={() => {
                              navigate(`/leads/${lead.id}`);
                              setOpenMenu(null);
                            }}
                            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </button>
                          {!lead.partner_id && (
                            <button
                              onClick={() => {
                                setAssignModal({ leadId: lead.id, open: true });
                                setOpenMenu(null);
                              }}
                              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Assign Partner
                            </button>
                          )}
                          {lead.status !== 'converted' && lead.status !== 'lost' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(lead.id, 'contacted')}
                                className="w-full flex items-center px-4 py-2 text-sm text-yellow-600 hover:bg-gray-50"
                              >
                                <Phone className="w-4 h-4 mr-2" />
                                Mark Contacted
                              </button>
                              <button
                                onClick={() => handleStatusChange(lead.id, 'qualified')}
                                className="w-full flex items-center px-4 py-2 text-sm text-green-600 hover:bg-gray-50"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark Qualified
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              handleDelete(lead.id);
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

        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No leads found</h3>
            <p className="mt-2 text-gray-500">Leads from the marketplace will appear here.</p>
          </div>
        )}
      </div>

      {/* Assign Partner Modal */}
      {assignModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setAssignModal({ leadId: '', open: false })} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Partner</h3>
            <p className="text-sm text-gray-500 mb-4">Select a partner to handle this lead</p>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {partners.map(partner => (
                <button
                  key={partner.id}
                  onClick={() => handleAssign(assignModal.leadId, partner.id)}
                  className="w-full flex items-center p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="ml-3 text-left">
                    <p className="font-medium text-gray-900">{partner.company_name}</p>
                    <p className="text-sm text-gray-500">{partner.specialization}</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setAssignModal({ leadId: '', open: false })}
              className="mt-4 w-full btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
