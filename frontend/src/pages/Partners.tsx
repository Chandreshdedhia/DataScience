import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { api, formatDate } from '../utils/api';
import type { Partner } from '../types';

export default function Partners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      const data = await api.getPartners();
      setPartners(data);
    } catch (error) {
      console.error('Error loading partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.updatePartner(id, { status });
      loadPartners();
      setOpenMenu(null);
    } catch (error) {
      console.error('Error updating partner:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this partner?')) return;
    try {
      await api.deletePartner(id);
      loadPartners();
    } catch (error) {
      console.error('Error deleting partner:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success"><CheckCircle className="w-3 h-3 mr-1" />Active</span>;
      case 'inactive':
        return <span className="badge badge-gray"><XCircle className="w-3 h-3 mr-1" />Inactive</span>;
      case 'pending':
        return <span className="badge badge-warning"><Clock className="w-3 h-3 mr-1" />Pending</span>;
      case 'rejected':
        return <span className="badge badge-danger"><XCircle className="w-3 h-3 mr-1" />Rejected</span>;
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || partner.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Partners</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your 3P refurbished equipment partners
          </p>
        </div>
        <Link to="/partners/new" className="btn btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          Onboard Partner
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search partners..."
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
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPartners.map((partner) => (
          <div
            key={partner.id}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 card-hover"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">{partner.company_name}</h3>
                  <p className="text-sm text-gray-500">{partner.contact_person}</p>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setOpenMenu(openMenu === partner.id ? null : partner.id)}
                  className="p-1 rounded-lg hover:bg-gray-100"
                >
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>
                {openMenu === partner.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                    <Link
                      to={`/partners/${partner.id}`}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Link>
                    {partner.status !== 'active' && (
                      <button
                        onClick={() => handleStatusChange(partner.id, 'active')}
                        className="w-full flex items-center px-4 py-2 text-sm text-green-600 hover:bg-gray-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Activate
                      </button>
                    )}
                    {partner.status === 'active' && (
                      <button
                        onClick={() => handleStatusChange(partner.id, 'inactive')}
                        className="w-full flex items-center px-4 py-2 text-sm text-yellow-600 hover:bg-gray-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Deactivate
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(partner.id)}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center text-sm text-gray-500">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                {partner.email}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                {partner.phone}
              </div>
              {partner.city && partner.state && (
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  {partner.city}, {partner.state}
                </div>
              )}
            </div>

            {partner.specialization && (
              <div className="mt-4">
                <p className="text-xs text-gray-400 mb-1">Specialization</p>
                <p className="text-sm text-gray-700">{partner.specialization}</p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              {getStatusBadge(partner.status)}
              <span className="text-xs text-gray-400">
                Joined {formatDate(partner.created_at)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredPartners.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Building2 className="w-12 h-12 mx-auto text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No partners found</h3>
          <p className="mt-2 text-gray-500">Get started by onboarding your first partner.</p>
          <Link to="/partners/new" className="btn btn-primary mt-4">
            <Plus className="w-5 h-5 mr-2" />
            Onboard Partner
          </Link>
        </div>
      )}
    </div>
  );
}
