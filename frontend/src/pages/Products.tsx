import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Package,
  Building2,
  Calendar,
  IndianRupee,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  Archive,
  Filter
} from 'lucide-react';
import { api, formatCurrency, formatDate } from '../utils/api';
import type { Product } from '../types';

const categories = ['All', 'CT Scanner', 'X-Ray', 'MRI', 'Ultrasound', 'Mammography', 'C-Arm'];
const conditions = ['Excellent', 'Good', 'Fair'];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const formData = new FormData();
      formData.append('status', status);
      await api.updateProduct(id, formData);
      loadProducts();
      setOpenMenu(null);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.deleteProduct(id);
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="badge badge-success"><CheckCircle className="w-3 h-3 mr-1" />Published</span>;
      case 'draft':
        return <span className="badge badge-gray"><Clock className="w-3 h-3 mr-1" />Draft</span>;
      case 'pending':
        return <span className="badge badge-warning"><Clock className="w-3 h-3 mr-1" />Pending</span>;
      case 'sold':
        return <span className="badge badge-info"><CheckCircle className="w-3 h-3 mr-1" />Sold</span>;
      case 'archived':
        return <span className="badge badge-gray"><Archive className="w-3 h-3 mr-1" />Archived</span>;
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'fair': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
    const matchesStatus = !statusFilter || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
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
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your refurbished medical equipment catalog
          </p>
        </div>
        <Link to="/products/new" className="btn btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  categoryFilter === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <select
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="sold">Sold</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const images = JSON.parse(product.images || '[]');
          return (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden card-hover"
            >
              {/* Product Image */}
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                {images.length > 0 ? (
                  <img
                    src={images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-16 h-16 text-gray-300" />
                )}
                <div className="absolute top-3 left-3">
                  {getStatusBadge(product.status)}
                </div>
                <div className="absolute top-3 right-3">
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === product.id ? null : product.id)}
                      className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                    {openMenu === product.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                        <Link
                          to={`/products/${product.id}`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Link>
                        {product.status === 'draft' && (
                          <button
                            onClick={() => handleStatusChange(product.id, 'published')}
                            className="w-full flex items-center px-4 py-2 text-sm text-green-600 hover:bg-gray-50"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Publish
                          </button>
                        )}
                        {product.status === 'published' && (
                          <button
                            onClick={() => handleStatusChange(product.id, 'archived')}
                            className="w-full flex items-center px-4 py-2 text-sm text-yellow-600 hover:bg-gray-50"
                          >
                            <Archive className="w-4 h-4 mr-2" />
                            Archive
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
                    {product.category}
                  </span>
                  {product.condition && (
                    <span className={`text-xs font-medium px-2 py-1 rounded ${getConditionColor(product.condition)}`}>
                      {product.condition}
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>

                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <Building2 className="w-4 h-4 mr-1" />
                  {product.brand} {product.model}
                </div>

                {product.year_of_manufacture && (
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    Year: {product.year_of_manufacture}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Price</p>
                    <p className="text-lg font-bold text-gray-900 flex items-center">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                  {product.warranty_months && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Warranty</p>
                      <p className="text-sm font-medium text-gray-700">
                        {product.warranty_months} months
                      </p>
                    </div>
                  )}
                </div>

                {product.partner_name && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400">Partner</p>
                    <p className="text-sm font-medium text-gray-700">{product.partner_name}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Package className="w-12 h-12 mx-auto text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
          <p className="mt-2 text-gray-500">Get started by adding your first product.</p>
          <Link to="/products/new" className="btn btn-primary mt-4">
            <Plus className="w-5 h-5 mr-2" />
            Add Product
          </Link>
        </div>
      )}
    </div>
  );
}
