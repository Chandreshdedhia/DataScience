import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  Mail,
  IndianRupee,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CreditCard
} from 'lucide-react';
import { api, formatCurrency, formatDate } from '../utils/api';
import type { Deal, Transaction } from '../types';

export default function DealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    type: 'receivable',
    amount: '',
    due_date: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDeal();
  }, [id]);

  const loadDeal = async () => {
    try {
      const data = await api.getDeal(id!);
      setDeal(data);
    } catch (error) {
      console.error('Error loading deal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await api.updateDeal(id!, { status });
      loadDeal();
    } catch (error) {
      console.error('Error updating deal:', error);
    }
  };

  const handlePaymentStatusChange = async (status: string) => {
    try {
      await api.updateDeal(id!, { payment_status: status });
      loadDeal();
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const handleAddTransaction = async () => {
    if (!transactionForm.amount || !transactionForm.due_date) return;
    setSaving(true);
    try {
      await api.createTransaction({
        deal_id: id,
        partner_id: deal?.partner_id,
        type: transactionForm.type,
        amount: parseFloat(transactionForm.amount),
        due_date: transactionForm.due_date,
        notes: transactionForm.notes,
        status: 'pending'
      });
      setShowTransactionModal(false);
      setTransactionForm({
        type: 'receivable',
        amount: '',
        due_date: '',
        notes: ''
      });
      loadDeal();
    } catch (error) {
      console.error('Error adding transaction:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTransactionStatusChange = async (transactionId: string, status: string) => {
    try {
      await api.updateTransaction(transactionId, {
        status,
        paid_date: status === 'paid' ? new Date().toISOString().split('T')[0] : null
      });
      loadDeal();
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'won':
        return <span className="badge badge-success"><CheckCircle className="w-3 h-3 mr-1" />Won</span>;
      case 'negotiation':
        return <span className="badge badge-warning"><Clock className="w-3 h-3 mr-1" />Negotiation</span>;
      case 'lost':
        return <span className="badge badge-danger"><XCircle className="w-3 h-3 mr-1" />Lost</span>;
      case 'cancelled':
        return <span className="badge badge-gray"><XCircle className="w-3 h-3 mr-1" />Cancelled</span>;
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  const getTransactionStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="badge badge-success">Paid</span>;
      case 'pending':
        return <span className="badge badge-warning">Pending</span>;
      case 'overdue':
        return <span className="badge badge-danger">Overdue</span>;
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-gray-300" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Deal not found</h3>
        <Link to="/deals" className="btn btn-primary mt-4">
          Back to Deals
        </Link>
      </div>
    );
  }

  // Calculate financial summary
  const totalReceivables = deal.transactions?.filter(t => t.type === 'receivable').reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalPayables = deal.transactions?.filter(t => t.type === 'payable').reduce((sum, t) => sum + t.amount, 0) || 0;
  const paidReceivables = deal.transactions?.filter(t => t.type === 'receivable' && t.status === 'paid').reduce((sum, t) => sum + t.amount, 0) || 0;
  const paidPayables = deal.transactions?.filter(t => t.type === 'payable' && t.status === 'paid').reduce((sum, t) => sum + t.amount, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/deals')}
            className="flex items-center text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back to Deals
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Deal Details</h1>
            {getStatusBadge(deal.status)}
          </div>
          <p className="text-gray-500 mt-1">
            {deal.customer_name} - {deal.customer_organization}
          </p>
        </div>
        {deal.status === 'negotiation' && (
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusChange('won')}
              className="btn btn-success"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Mark as Won
            </button>
            <button
              onClick={() => handleStatusChange('lost')}
              className="btn btn-secondary text-red-600"
            >
              <XCircle className="w-5 h-5 mr-2" />
              Mark as Lost
            </button>
          </div>
        )}
      </div>

      {/* Deal Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Deal Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(deal.deal_value)}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Commission ({deal.commission_rate}%)</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(deal.commission_amount)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Collected</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(paidReceivables)}</p>
              <p className="text-xs text-gray-400">of {formatCurrency(totalReceivables)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Paid Out</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{formatCurrency(paidPayables)}</p>
              <p className="text-xs text-gray-400">of {formatCurrency(totalPayables)}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transactions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Transactions</h3>
              <button
                onClick={() => setShowTransactionModal(true)}
                className="btn btn-primary text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Transaction
              </button>
            </div>

            {/* Receivables */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                Receivables (Incoming)
              </h4>
              <div className="space-y-3">
                {deal.transactions?.filter(t => t.type === 'receivable').map(transaction => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <IndianRupee className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{formatCurrency(transaction.amount)}</p>
                        <p className="text-sm text-gray-500">
                          Due: {formatDate(transaction.due_date!)}
                          {transaction.paid_date && ` | Paid: ${formatDate(transaction.paid_date)}`}
                        </p>
                        {transaction.notes && (
                          <p className="text-xs text-gray-400 mt-1">{transaction.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTransactionStatusBadge(transaction.status)}
                      {transaction.status === 'pending' && (
                        <button
                          onClick={() => handleTransactionStatusChange(transaction.id, 'paid')}
                          className="btn btn-success text-xs py-1 px-2"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {(!deal.transactions || deal.transactions.filter(t => t.type === 'receivable').length === 0) && (
                  <p className="text-center text-gray-500 py-4">No receivables yet</p>
                )}
              </div>
            </div>

            {/* Payables */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <TrendingDown className="w-4 h-4 mr-2 text-orange-500" />
                Payables (Outgoing)
              </h4>
              <div className="space-y-3">
                {deal.transactions?.filter(t => t.type === 'payable').map(transaction => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <IndianRupee className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{formatCurrency(transaction.amount)}</p>
                        <p className="text-sm text-gray-500">
                          Due: {formatDate(transaction.due_date!)}
                          {transaction.paid_date && ` | Paid: ${formatDate(transaction.paid_date)}`}
                        </p>
                        {transaction.notes && (
                          <p className="text-xs text-gray-400 mt-1">{transaction.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTransactionStatusBadge(transaction.status)}
                      {transaction.status === 'pending' && (
                        <button
                          onClick={() => handleTransactionStatusChange(transaction.id, 'paid')}
                          className="btn btn-success text-xs py-1 px-2"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {(!deal.transactions || deal.transactions.filter(t => t.type === 'payable').length === 0) && (
                  <p className="text-center text-gray-500 py-4">No payables yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">{deal.customer_name}</p>
                  <p className="text-sm text-gray-500">{deal.customer_organization}</p>
                </div>
              </div>
              {deal.customer_email && (
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  <p className="text-sm text-gray-600">{deal.customer_email}</p>
                </div>
              )}
              {deal.customer_phone && (
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  <p className="text-sm text-gray-600">{deal.customer_phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Partner Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Partner</h3>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900">{deal.partner_name}</p>
                <p className="text-sm text-gray-500">Refurbished Partner</p>
              </div>
            </div>
          </div>

          {/* Deal Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deal Information</h3>
            <div className="space-y-4">
              {deal.product_name && (
                <div>
                  <p className="text-sm text-gray-500">Product</p>
                  <p className="font-medium text-gray-900">{deal.product_name}</p>
                </div>
              )}
              {deal.invoice_number && (
                <div>
                  <p className="text-sm text-gray-500">Invoice Number</p>
                  <p className="font-medium text-gray-900">{deal.invoice_number}</p>
                </div>
              )}
              {deal.closure_date && (
                <div>
                  <p className="text-sm text-gray-500">Closure Date</p>
                  <p className="font-medium text-gray-900">{formatDate(deal.closure_date)}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Payment Status</p>
                <div className="mt-1">
                  <select
                    value={deal.payment_status}
                    onChange={(e) => handlePaymentStatusChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none bg-white text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>
              {deal.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="text-gray-700">{deal.notes}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium text-gray-900">{formatDate(deal.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setShowTransactionModal(false)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Transaction</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={transactionForm.type}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="receivable">Receivable (Incoming)</option>
                  <option value="payable">Payable (Outgoing)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={transactionForm.due_date}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, due_date: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={transactionForm.notes}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  placeholder="Add notes..."
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowTransactionModal(false)}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTransaction}
                disabled={saving || !transactionForm.amount || !transactionForm.due_date}
                className="flex-1 btn btn-primary"
              >
                {saving ? 'Adding...' : 'Add Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
