import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Package,
  Users,
  Handshake,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  ArrowRight,
  Activity,
  Target,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Funnel,
  FunnelChart,
  LabelList
} from 'recharts';
import { api, formatCurrency, formatDateTime } from '../utils/api';
import type { DashboardStats, LeadFunnel } from '../types';

const FUNNEL_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#22c55e', '#86efac', '#fbbf24', '#f97316', '#ef4444'];
const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [funnel, setFunnel] = useState<LeadFunnel | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [productCategories, setProductCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, funnelData, activitiesData, categoriesData] = await Promise.all([
        api.getDashboardStats(),
        api.getLeadFunnel(),
        api.getRecentActivities(),
        api.getProductsByCategory()
      ]);
      setStats(statsData);
      setFunnel(funnelData);
      setActivities(activitiesData);
      setProductCategories(categoriesData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const funnelData = funnel ? [
    { name: 'New Leads', value: funnel.new, fill: FUNNEL_COLORS[0] },
    { name: 'Assigned', value: funnel.assigned, fill: FUNNEL_COLORS[1] },
    { name: 'Contacted', value: funnel.contacted, fill: FUNNEL_COLORS[2] },
    { name: 'Qualified', value: funnel.qualified, fill: FUNNEL_COLORS[3] },
    { name: 'Negotiation', value: funnel.negotiation, fill: FUNNEL_COLORS[4] },
    { name: 'Deal Created', value: funnel.deal_created, fill: FUNNEL_COLORS[5] },
    { name: 'Converted', value: funnel.converted, fill: FUNNEL_COLORS[6] },
  ].filter(item => item.value > 0) : [];

  const statCards = [
    {
      title: 'Active Partners',
      value: stats?.partners.active || 0,
      total: stats?.partners.total || 0,
      icon: Building2,
      color: 'bg-blue-500',
      link: '/partners'
    },
    {
      title: 'Published Products',
      value: stats?.products.published || 0,
      total: stats?.products.total || 0,
      icon: Package,
      color: 'bg-green-500',
      link: '/products'
    },
    {
      title: 'Active Leads',
      value: stats?.leads.qualified || 0,
      total: stats?.leads.total || 0,
      icon: Users,
      color: 'bg-purple-500',
      link: '/leads'
    },
    {
      title: 'Won Deals',
      value: stats?.deals.won || 0,
      total: stats?.deals.total || 0,
      icon: Handshake,
      color: 'bg-orange-500',
      link: '/deals'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created': return <Activity className="w-4 h-4 text-blue-500" />;
      case 'status_change': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'assigned': return <Target className="w-4 h-4 text-purple-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome to 3P Partner Portal</h1>
            <p className="mt-1 text-primary-100">
              Manage your refurbished medical equipment marketplace
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/partners/new" className="btn bg-white text-primary-600 hover:bg-primary-50">
              Onboard Partner
            </Link>
            <Link to="/products/new" className="btn bg-primary-500 text-white hover:bg-primary-400">
              Add Product
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              to={stat.link}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 card-hover"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="mt-1 text-sm text-gray-500">of {stat.total} total</p>
                </div>
                <div className={`w-14 h-14 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Total Revenue</h3>
            <span className="badge badge-success">
              <TrendingUp className="w-3 h-3 mr-1" /> Active
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(stats?.deals.totalValue || 0)}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            From {stats?.deals.won || 0} completed deals
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Commission Earned</h3>
            <IndianRupee className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(stats?.deals.totalCommission || 0)}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Platform commission from deals
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Conversion Rate</h3>
            <Target className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-purple-600">
            {stats?.leads.conversionRate || 0}%
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Leads converted to deals
          </p>
        </div>
      </div>

      {/* Lead Journey Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Lead Journey Funnel</h3>
            <Link to="/leads" className="text-sm text-primary-600 hover:text-primary-700 flex items-center">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          {funnelData.length > 0 ? (
            <div className="space-y-3">
              {funnelData.map((item, index) => {
                const maxValue = Math.max(...funnelData.map(d => d.value));
                const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                return (
                  <div key={item.name} className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                      <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: item.fill,
                          minWidth: item.value > 0 ? '40px' : '0'
                        }}
                      >
                        {percentage > 20 && (
                          <span className="text-xs font-medium text-white">
                            {Math.round(percentage)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Users className="w-12 h-12 mb-2 text-gray-300" />
              <p>No leads data available</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Products by Category</h3>
            <Link to="/products" className="text-sm text-primary-600 hover:text-primary-700 flex items-center">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          {productCategories.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={productCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="category"
                  label={({ category, count }) => `${category}: ${count}`}
                >
                  {productCategories.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Package className="w-12 h-12 mb-2 text-gray-300" />
              <p>No products data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Pending Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Actions</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">New Leads</p>
                  <p className="text-xs text-gray-500">Awaiting assignment</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-yellow-600">{stats?.leads.new || 0}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Pending Receivables</p>
                  <p className="text-xs text-gray-500">Amount to collect</p>
                </div>
              </div>
              <span className="text-lg font-bold text-orange-600">
                {formatCurrency(stats?.financials.pendingReceivables || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Pending Payables</p>
                  <p className="text-xs text-gray-500">Commission to pay</p>
                </div>
              </div>
              <span className="text-lg font-bold text-red-600">
                {formatCurrency(stats?.financials.pendingPayables || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Link to="/leads" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.customer_name}</span>
                      {activity.customer_organization && (
                        <span className="text-gray-500"> - {activity.customer_organization}</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateTime(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
