import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Calendar,
  Building2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { api, formatCurrency, formatDate } from '../utils/api';
import type { Transaction, DashboardStats } from '../types';

export default function Financials() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'receivables' | 'payables'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [transactionsData, statsData] = await Promise.all([
        api.getTransactions(),
        api.getDashboardStats()
      ]);
      setTransactions(transactionsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.updateTransaction(id, {
        status,
        paid_date: status === 'paid' ? new Date().toISOString().split('T')[0] : null
      });
      loadData();
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="badge badge-success"><CheckCircle className="w-3 h-3 mr-1" />Paid</span>;
      case 'pending':
        return <span className="badge badge-warning"><Clock className="w-3 h-3 mr-1" />Pending</span>;
      case 'overdue':
        return <span className="badge badge-danger"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</span>;
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (activeTab === 'receivables' && t.type !== 'receivable') return false;
    if (activeTab === 'payables' && t.type !== 'payable') return false;
    if (typeFilter && t.type !== typeFilter) return false;
    if (statusFilter && t.status !== statusFilter) return false;
    return true;
  });

  // Summary calculations
  const totalReceivables = transactions.filter(t => t.type === 'receivable').reduce((sum, t) => sum + t.amount, 0);
  const pendingReceivables = transactions.filter(t => t.type === 'receivable' && t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
  const paidReceivables = transactions.filter(t => t.type === 'receivable' && t.status === 'paid').reduce((sum, t) => sum + t.amount, 0);

  const totalPayables = transactions.filter(t => t.type === 'payable').reduce((sum, t) => sum + t.amount, 0);
  const pendingPayables = transactions.filter(t => t.type === 'payable' && t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
  const paidPayables = transactions.filter(t => t.type === 'payable' && t.status === 'paid').reduce((sum, t) => sum + t.amount, 0);

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
          <h1 className="text-2xl font-bold text-gray-900">Financials</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track all payables and receivables across deals
          </p>
        </div>
        <button className="btn btn-secondary">
          <Download className="w-5 h-5 mr-2" />
          Export Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(stats?.deals.totalValue || 0)}
              </p>
              <p className="text-primary-200 text-sm mt-2">
                From {stats?.deals.won || 0} deals
              </p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <IndianRupee className="w-7 h-7" />
            </div>
          </div>
        </div>

        {/* Commission Earned */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Commission Earned</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(stats?.deals.totalCommission || 0)}
              </p>
              <p className="text-green-200 text-sm mt-2">
                Platform earnings
              </p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7" />
            </div>
          </div>
        </div>

        {/* Pending Receivables */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending Receivables</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {formatCurrency(pendingReceivables)}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {formatCurrency(paidReceivables)} collected
              </p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Pending Payables */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending Payables</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">
                {formatCurrency(pendingPayables)}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {formatCurrency(paidPayables)} paid out
              </p>
            </div>
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-7 h-7 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-100">
          <div className="flex">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              All Transactions
            </button>
            <button
              onClick={() => setActiveTab('receivables')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center ${
                activeTab === 'receivables'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Receivables
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                {transactions.filter(t => t.type === 'receivable').length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('payables')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center ${
                activeTab === 'payables'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              Payables
              <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                {transactions.filter(t => t.type === 'payable').length}
              </span>
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Partner
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Due Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Deal
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {transaction.type === 'receivable' ? (
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <TrendingDown className="w-4 h-4 text-orange-600" />
                        </div>
                      )}
                      <span className={`ml-2 text-sm font-medium capitalize ${
                        transaction.type === 'receivable' ? 'text-green-700' : 'text-orange-700'
                      }`}>
                        {transaction.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-primary-600" />
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        {transaction.partner_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className={`font-semibold ${
                      transaction.type === 'receivable' ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {formatCurrency(transaction.amount)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                      {formatDate(transaction.due_date!)}
                    </div>
                    {transaction.paid_date && (
                      <p className="text-xs text-gray-400 mt-1">
                        Paid: {formatDate(transaction.paid_date)}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(transaction.status)}
                  </td>
                  <td className="px-6 py-4">
                    {transaction.invoice_number ? (
                      <span className="text-sm text-gray-600">{transaction.invoice_number}</span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {transaction.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(transaction.id, 'paid')}
                          className="btn btn-success text-xs py-1 px-3"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Mark Paid
                        </button>
                      )}
                      <Link
                        to={`/deals/${transaction.deal_id}`}
                        className="p-2 rounded-lg hover:bg-gray-100"
                      >
                        <Eye className="w-4 h-4 text-gray-500" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <IndianRupee className="w-12 h-12 mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No transactions found</h3>
            <p className="mt-2 text-gray-500">Transactions will appear here when deals are created.</p>
          </div>
        )}
      </div>

      {/* Quick Summary Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Receivables Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
            Receivables Summary
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Expected</span>
              <span className="font-semibold text-gray-900">{formatCurrency(totalReceivables)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Collected</span>
              <span className="font-semibold text-green-600">{formatCurrency(paidReceivables)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pending</span>
              <span className="font-semibold text-yellow-600">{formatCurrency(pendingReceivables)}</span>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${totalReceivables > 0 ? (paidReceivables / totalReceivables) * 100 : 0}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {totalReceivables > 0 ? Math.round((paidReceivables / totalReceivables) * 100) : 0}% collected
              </p>
            </div>
          </div>
        </div>

        {/* Payables Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingDown className="w-5 h-5 mr-2 text-orange-500" />
            Payables Summary
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Owed</span>
              <span className="font-semibold text-gray-900">{formatCurrency(totalPayables)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Paid Out</span>
              <span className="font-semibold text-green-600">{formatCurrency(paidPayables)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pending</span>
              <span className="font-semibold text-orange-600">{formatCurrency(pendingPayables)}</span>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-orange-500 h-3 rounded-full transition-all"
                  style={{ width: `${totalPayables > 0 ? (paidPayables / totalPayables) * 100 : 0}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {totalPayables > 0 ? Math.round((paidPayables / totalPayables) * 100) : 0}% paid out
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
