import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Target,
  Package,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  IndianRupee,
  Plus,
  Edit,
  Activity
} from 'lucide-react';
import { api, formatDate, formatDateTime, formatCurrency } from '../utils/api';
import type { Lead, Partner, Product } from '../types';

const statusSteps = [
  { key: 'new', label: 'New Lead', icon: AlertCircle, color: 'bg-blue-500' },
  { key: 'assigned', label: 'Assigned', icon: User, color: 'bg-purple-500' },
  { key: 'contacted', label: 'Contacted', icon: Phone, color: 'bg-yellow-500' },
  { key: 'qualified', label: 'Qualified', icon: CheckCircle, color: 'bg-orange-500' },
  { key: 'negotiation', label: 'Negotiation', icon: Target, color: 'bg-pink-500' },
  { key: 'deal_created', label: 'Deal Created', icon: IndianRupee, color: 'bg-indigo-500' },
  { key: 'converted', label: 'Converted', icon: CheckCircle, color: 'bg-green-500' }
];

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [leadData, partnersData, productsData] = await Promise.all([
        api.getLead(id!),
        api.getPartners(),
        api.getProducts()
      ]);
      setLead(leadData);
      setPartners(partnersData.filter((p: Partner) => p.status === 'active'));
      setProducts(productsData.filter((p: Product) => p.status === 'published'));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await api.updateLead(id!, { status });
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      await api.addLeadActivity(id!, {
        activity_type: 'note',
        description: newNote
      });
      setNewNote('');
      loadData();
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDeal = () => {
    navigate(`/deals?create=true&lead_id=${id}`);
  };

  const getCurrentStatusIndex = () => {
    return statusSteps.findIndex(s => s.key === lead?.status);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created': return <Plus className="w-4 h-4 text-blue-500" />;
      case 'status_change': return <Activity className="w-4 h-4 text-green-500" />;
      case 'assigned': return <User className="w-4 h-4 text-purple-500" />;
      case 'note': return <MessageSquare className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-gray-300" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Lead not found</h3>
        <Link to="/leads" className="btn btn-primary mt-4">
          Back to Leads
        </Link>
      </div>
    );
  }

  const currentIndex = getCurrentStatusIndex();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/leads')}
            className="flex items-center text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back to Leads
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{lead.customer_name}</h1>
          {lead.customer_organization && (
            <p className="text-gray-500">{lead.customer_organization}</p>
          )}
        </div>
        <div className="flex gap-2">
          {lead.status !== 'converted' && lead.status !== 'lost' && (
            <button onClick={handleCreateDeal} className="btn btn-success">
              <IndianRupee className="w-5 h-5 mr-2" />
              Create Deal
            </button>
          )}
        </div>
      </div>

      {/* Journey Progress */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Lead Journey</h3>
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded">
            <div
              className="h-full bg-primary-500 rounded transition-all duration-500"
              style={{ width: `${(currentIndex / (statusSteps.length - 1)) * 100}%` }}
            />
          </div>

          {/* Steps */}
          <div className="relative flex justify-between">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              const isClickable = index <= currentIndex + 1 && index > currentIndex;

              return (
                <button
                  key={step.key}
                  onClick={() => isClickable && handleStatusChange(step.key)}
                  disabled={!isClickable}
                  className={`flex flex-col items-center ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isCompleted || isCurrent
                        ? step.color + ' text-white'
                        : 'bg-gray-200 text-gray-400'
                    } ${isCurrent ? 'ring-4 ring-primary-200' : ''} ${
                      isClickable ? 'hover:ring-4 hover:ring-primary-100' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`mt-2 text-xs font-medium ${
                    isCurrent ? 'text-primary-600' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        {lead.status !== 'converted' && lead.status !== 'lost' && (
          <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap gap-2">
            {currentIndex < statusSteps.length - 1 && (
              <button
                onClick={() => handleStatusChange(statusSteps[currentIndex + 1].key)}
                className="btn btn-primary text-sm"
              >
                Move to {statusSteps[currentIndex + 1].label}
              </button>
            )}
            <button
              onClick={() => handleStatusChange('lost')}
              className="btn btn-secondary text-sm text-red-600"
            >
              Mark as Lost
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{lead.customer_email}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{lead.customer_phone}</p>
                </div>
              </div>
              {(lead.customer_city || lead.customer_state) && (
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">
                      {[lead.customer_city, lead.customer_state].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium text-gray-900">{formatDate(lead.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Requirement */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Requirement</h3>
            <div className="space-y-4">
              {lead.requirement && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-gray-900">{lead.requirement}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {lead.budget_range && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Budget Range</p>
                    <p className="font-medium text-gray-900">{lead.budget_range}</p>
                  </div>
                )}
                {lead.product_name && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Interested Product</p>
                    <p className="font-medium text-gray-900">{lead.product_name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>

            {/* Add Note */}
            <div className="flex gap-3 mb-6">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex-1">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note or update..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none resize-none"
                />
                <button
                  onClick={handleAddNote}
                  disabled={saving || !newNote.trim()}
                  className="mt-2 btn btn-primary text-sm"
                >
                  {saving ? 'Adding...' : 'Add Note'}
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              {lead.activities?.map((activity, index) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <div className="flex-1 pb-4 border-b border-gray-100 last:border-0">
                    <p className="text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateTime(activity.created_at)} by {activity.created_by}
                    </p>
                  </div>
                </div>
              ))}

              {(!lead.activities || lead.activities.length === 0) && (
                <p className="text-center text-gray-500 py-4">No activity yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assigned Partner */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Partner</h3>
            {lead.partner_name ? (
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary-600" />
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">{lead.partner_name}</p>
                  <p className="text-sm text-gray-500">Assigned Partner</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-3">No partner assigned yet</p>
                <Link to="/leads" className="btn btn-primary text-sm">
                  Assign Partner
                </Link>
              </div>
            )}
          </div>

          {/* Lead Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Source</p>
                <p className="font-medium text-gray-900 capitalize">{lead.source}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Priority</p>
                <span className={`inline-block px-2 py-1 text-sm font-medium rounded ${
                  lead.priority === 'high' ? 'bg-red-100 text-red-700' :
                  lead.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-block px-2 py-1 text-sm font-medium rounded ${
                  lead.status === 'converted' ? 'bg-green-100 text-green-700' :
                  lead.status === 'lost' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {lead.status.replace('_', ' ').charAt(0).toUpperCase() + lead.status.replace('_', ' ').slice(1)}
                </span>
              </div>
              {lead.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="text-gray-900">{lead.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
