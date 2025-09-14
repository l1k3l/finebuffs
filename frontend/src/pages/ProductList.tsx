import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createApiClient } from '../lib/api';
import { Product } from '../types';
import { getSupabaseImageUrl } from '../utils/supabase';

const ProductList: React.FC = () => {
  const { getAccessToken } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      const api = createApiClient(getAccessToken);
      const response = await api.getProducts();
      setProducts(response.products);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your product inventory
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/products/add"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
          >
            ➕ Add Product
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      )}

      {/* Search */}
      <div className="max-w-md">
        <input
          type="text"
          placeholder="Search products..."
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No products found' : 'No products yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm
              ? `No products match "${searchTerm}"`
              : 'Get started by adding your first product'
            }
          </p>
          {!searchTerm && (
            <Link
              to="/products/add"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              ➕ Add Your First Product
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
              {/* Product Image */}
              <Link to={`/product/${product.id}`} className="block aspect-square bg-gray-50 flex items-center justify-center cursor-pointer">
                <img
                  src={getSupabaseImageUrl(product.image_url)}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-image.jpeg';
                  }}
                />
              </Link>

              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                    {product.description && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-500">Stock:</span>
                      <span className={`ml-2 text-lg font-semibold ${
                        product.stock_count <= product.reorder_level
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}>
                        {product.stock_count}
                      </span>
                    </div>
                    {product.stock_count <= product.reorder_level && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        ⚠️ Low Stock
                      </span>
                    )}
                  </div>

                  <div className="mt-2 text-sm text-gray-500">
                    Reorder at: {product.reorder_level}
                  </div>

                  <div className="mt-4 flex space-x-3">
                    <Link
                      to={`/product/${product.id}`}
                      className="flex-1 text-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                    >
                      View Details
                    </Link>
                    <Link
                      to={`/product/${product.id}#stock-update`}
                      className="flex-1 text-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      📝 Quick Update
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;