import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Upload,
  X,
  Image,
  FileText,
  Save,
  Loader2,
  Plus
} from 'lucide-react';
import { api, formatCurrency } from '../utils/api';
import type { Partner } from '../types';

interface FormData {
  partner_id: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  year_of_manufacture: string;
  condition: string;
  price: string;
  description: string;
  specifications: string;
  warranty_months: string;
  status: string;
}

const initialFormData: FormData = {
  partner_id: '',
  name: '',
  category: '',
  brand: '',
  model: '',
  year_of_manufacture: '',
  condition: '',
  price: '',
  description: '',
  specifications: '',
  warranty_months: '',
  status: 'draft'
};

const categories = ['CT Scanner', 'X-Ray', 'MRI', 'Ultrasound', 'Mammography', 'C-Arm', 'Other'];
const conditions = ['Excellent', 'Good', 'Fair'];
const brands = ['Siemens', 'GE Healthcare', 'Philips', 'Toshiba', 'Hitachi', 'Samsung', 'Fujifilm', 'Other'];

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [activeTab, setActiveTab] = useState(0);
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }]);

  const isEditing = !!id;

  useEffect(() => {
    loadPartners();
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadPartners = async () => {
    try {
      const data = await api.getPartners();
      setPartners(data.filter((p: Partner) => p.status === 'active'));
    } catch (error) {
      console.error('Error loading partners:', error);
    }
  };

  const loadProduct = async () => {
    setLoading(true);
    try {
      const product = await api.getProduct(id!);
      setFormData({
        partner_id: product.partner_id || '',
        name: product.name || '',
        category: product.category || '',
        brand: product.brand || '',
        model: product.model || '',
        year_of_manufacture: product.year_of_manufacture?.toString() || '',
        condition: product.condition || '',
        price: product.price?.toString() || '',
        description: product.description || '',
        specifications: product.specifications || '',
        warranty_months: product.warranty_months?.toString() || '',
        status: product.status || 'draft'
      });

      // Parse specifications
      if (product.specifications) {
        try {
          const specsObj = JSON.parse(product.specifications);
          const specsArray = Object.entries(specsObj).map(([key, value]) => ({
            key,
            value: String(value)
          }));
          if (specsArray.length > 0) {
            setSpecs(specsArray);
          }
        } catch (e) {
          // Keep default if parsing fails
        }
      }

      setExistingImages(JSON.parse(product.images || '[]'));
      setExistingDocuments(JSON.parse(product.documents || '[]'));
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSpecChange = (index: number, field: 'key' | 'value', value: string) => {
    const newSpecs = [...specs];
    newSpecs[index][field] = value;
    setSpecs(newSpecs);
  };

  const addSpec = () => {
    setSpecs([...specs, { key: '', value: '' }]);
  };

  const removeSpec = (index: number) => {
    if (specs.length > 1) {
      setSpecs(specs.filter((_, i) => i !== index));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files]);
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setDocuments(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const removeExistingDocument = (index: number) => {
    setExistingDocuments(existingDocuments.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.partner_id) newErrors.partner_id = 'Partner is required';
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.price || isNaN(Number(formData.price))) newErrors.price = 'Valid price is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const submitData = new FormData();

      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'specifications') {
          // Convert specs array to JSON object
          const specsObj = specs.reduce((acc, { key, value }) => {
            if (key.trim()) {
              acc[key.trim()] = value.trim();
            }
            return acc;
          }, {} as Record<string, string>);
          submitData.append(key, JSON.stringify(specsObj));
        } else {
          submitData.append(key, value);
        }
      });

      // Add new images
      images.forEach(file => {
        submitData.append('images', file);
      });

      // Add new documents
      documents.forEach(file => {
        submitData.append('documents', file);
      });

      if (isEditing) {
        await api.updateProduct(id!, submitData);
      } else {
        await api.createProduct(submitData);
      }
      navigate('/products');
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { name: 'Basic Info', icon: Package },
    { name: 'Specifications', icon: FileText },
    { name: 'Media', icon: Image }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/products')}
          className="flex items-center text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back to Products
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </h1>
        <p className="mt-1 text-gray-500">
          {isEditing ? 'Update product information' : 'Add a new refurbished equipment to the catalog'}
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex overflow-x-auto">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(index)}
                className={`flex-1 flex items-center justify-center px-4 py-4 text-sm font-medium border-b-2 transition-colors min-w-[120px] ${
                  activeTab === index
                    ? 'border-primary-500 text-primary-600 bg-primary-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {/* Tab 0: Basic Info */}
          {activeTab === 0 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partner *
                </label>
                <select
                  name="partner_id"
                  value={formData.partner_id}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none bg-white ${
                    errors.partner_id ? 'border-red-500' : 'border-gray-200'
                  }`}
                >
                  <option value="">Select Partner</option>
                  {partners.map(partner => (
                    <option key={partner.id} value={partner.id}>
                      {partner.company_name}
                    </option>
                  ))}
                </select>
                {errors.partner_id && (
                  <p className="mt-1 text-sm text-red-500">{errors.partner_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${
                    errors.name ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="e.g., Siemens Somatom Definition AS 64-Slice CT Scanner"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none bg-white ${
                      errors.category ? 'border-red-500' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-500">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none bg-white"
                  >
                    <option value="">Select Brand</option>
                    {brands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none"
                    placeholder="Enter model number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year of Manufacture
                  </label>
                  <input
                    type="number"
                    name="year_of_manufacture"
                    value={formData.year_of_manufacture}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none"
                    placeholder="e.g., 2020"
                    min="1990"
                    max={new Date().getFullYear()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none bg-white"
                  >
                    <option value="">Select Condition</option>
                    {conditions.map(cond => (
                      <option key={cond} value={cond}>{cond}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (INR) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${
                      errors.price ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Enter price"
                    min="0"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-500">{errors.price}</p>
                  )}
                  {formData.price && !errors.price && (
                    <p className="mt-1 text-sm text-gray-500">
                      {formatCurrency(Number(formData.price))}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Warranty (Months)
                  </label>
                  <input
                    type="number"
                    name="warranty_months"
                    value={formData.warranty_months}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none"
                    placeholder="e.g., 12"
                    min="0"
                    max="60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none bg-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending">Pending Review</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  placeholder="Enter detailed product description..."
                />
              </div>
            </div>
          )}

          {/* Tab 1: Specifications */}
          {activeTab === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Technical Specifications</h3>
                <button
                  type="button"
                  onClick={addSpec}
                  className="btn btn-secondary text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Specification
                </button>
              </div>

              <div className="space-y-3">
                {specs.map((spec, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={spec.key}
                      onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none"
                      placeholder="Specification name (e.g., Slices)"
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none"
                      placeholder="Value (e.g., 64)"
                    />
                    <button
                      type="button"
                      onClick={() => removeSpec(index)}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Common Specifications</h4>
                <div className="flex flex-wrap gap-2">
                  {['Slices', 'Rotation Time', 'Power', 'Detector Size', 'Resolution', 'Tube Capacity'].map(spec => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => {
                        if (!specs.some(s => s.key === spec)) {
                          setSpecs([...specs, { key: spec, value: '' }]);
                        }
                      }}
                      className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      + {spec}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Media */}
          {activeTab === 2 && (
            <div className="space-y-8">
              {/* Images */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h3>

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {existingImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img}
                          alt={`Product ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New Images Preview */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {images.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <span className="absolute bottom-2 left-2 px-2 py-1 bg-green-500 text-white text-xs rounded">
                          New
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Area */}
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 text-gray-400 mb-3" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 10MB</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                  />
                </label>
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Documents</h3>

                {/* Existing Documents */}
                {existingDocuments.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {existingDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-primary-500 mr-2" />
                          <span className="text-sm text-gray-700">{doc.split('/').pop()}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExistingDocument(index)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New Documents Preview */}
                {documents.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {documents.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-green-500 mr-2" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded">New</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Area */}
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileText className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      Upload technical documents, manuals, certifications
                    </p>
                    <p className="text-xs text-gray-400">PDF, DOC, DOCX up to 20MB</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    multiple
                    onChange={handleDocumentUpload}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Navigation & Submit */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
            <div className="flex gap-2">
              {activeTab > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab - 1)}
                  className="btn btn-secondary"
                >
                  Previous
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {activeTab < tabs.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab + 1)}
                  className="btn btn-primary"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-success"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      {isEditing ? 'Update Product' : 'Add Product'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
