import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createApiClient } from '../lib/api';

const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    stock_count: 0,
    reorder_level: 10,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'stock_count' || name === 'reorder_level' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const api = createApiClient(getAccessToken);
      const response = await api.createProduct(formData);

      // Navigate to the new product's detail page
      navigate(`/product/${response.product.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link to="/products" className="text-indigo-600 hover:text-indigo-500 text-sm">
          ← Back to products
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Add New Product</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create a new product in your warehouse inventory
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Product Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter product name"
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>

          {/* SKU */}
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
              SKU (Stock Keeping Unit) *
            </label>
            <input
              type="text"
              id="sku"
              name="sku"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., WID-001, GAD-123"
              value={formData.sku}
              onChange={handleInputChange}
            />
            <p className="mt-1 text-sm text-gray-500">
              A unique identifier for this product. Use letters, numbers, and hyphens.
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter product description (optional)"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          {/* Stock Count and Reorder Level */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="stock_count" className="block text-sm font-medium text-gray-700">
                Initial Stock Count *
              </label>
              <input
                type="number"
                id="stock_count"
                name="stock_count"
                required
                min="0"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.stock_count}
                onChange={handleInputChange}
              />
              <p className="mt-1 text-sm text-gray-500">
                How many units do you currently have?
              </p>
            </div>

            <div>
              <label htmlFor="reorder_level" className="block text-sm font-medium text-gray-700">
                Reorder Level *
              </label>
              <input
                type="number"
                id="reorder_level"
                name="reorder_level"
                required
                min="1"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.reorder_level}
                onChange={handleInputChange}
              />
              <p className="mt-1 text-sm text-gray-500">
                Alert when stock falls to this level
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              to="/products"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>

      {/* Preview Card */}
      {formData.name && (
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-lg font-medium text-gray-900">{formData.name || 'Product Name'}</h4>
                <p className="text-sm text-gray-500">SKU: {formData.sku || 'SKU-000'}</p>
                {formData.description && (
                  <p className="mt-1 text-sm text-gray-600">{formData.description}</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-500">Stock:</span>
                <span className={`ml-2 text-lg font-semibold ${
                  formData.stock_count <= formData.reorder_level
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}>
                  {formData.stock_count}
                </span>
              </div>
              {formData.stock_count <= formData.reorder_level && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  ⚠️ Low Stock
                </span>
              )}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Reorder at: {formData.reorder_level}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProduct;