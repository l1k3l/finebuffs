import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createApiClient } from '../lib/api';
import { Product, Transaction } from '../types';
import { getSupabaseImageUrl } from '../utils/supabase';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getAccessToken } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState('');

  // Stock update form
  const [stockChange, setStockChange] = useState('');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [shouldHighlight, setShouldHighlight] = useState(false);

  const fetchProductData = useCallback(async () => {
    if (!id) return;

    try {
      const api = createApiClient(getAccessToken);

      // Fetch product details and QR code in parallel
      const [productResponse, qrResponse] = await Promise.all([
        api.getProduct(id),
        api.getProductQRCode(id),
      ]);

      setProduct(productResponse.product);
      setQrCode(qrResponse.qr_code_image);

      // Fetch recent transactions for this product
      const transactionsResponse = await api.getTransactions(20, id);
      setTransactions(transactionsResponse.transactions);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, getAccessToken]);

  useEffect(() => {
    if (id) {
      fetchProductData();
    }
  }, [id, fetchProductData]);

  useEffect(() => {
    // Auto-scroll to stock update form if hash is present
    if (window.location.hash === '#stock-update' && !loading && product) {
      setShouldHighlight(true);
      setTimeout(() => {
        const element = document.getElementById('stock-update-form');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500); // Longer delay to ensure page is fully loaded

      // Remove highlight after 3 seconds
      setTimeout(() => setShouldHighlight(false), 3500);
    }
  }, [loading, product]); // Trigger when loading is done and product is loaded

  const handleStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !stockChange) return;

    setUpdating(true);
    setUpdateSuccess('');
    setError('');

    try {
      const api = createApiClient(getAccessToken);
      const changeAmount = parseInt(stockChange);

      await api.updateStock({
        product_id: product.id,
        change_amount: changeAmount,
        notes: notes.trim() || undefined,
      });

      // Refresh product data
      await fetchProductData();

      // Reset form
      setStockChange('');
      setNotes('');
      setUpdateSuccess(`Stock ${changeAmount > 0 ? 'increased' : 'decreased'} by ${Math.abs(changeAmount)} units`);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Product not found</h3>
        <Link to="/products" className="text-brand-600 hover:text-brand-500">
          ← Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/products" className="text-brand-600 hover:text-brand-500 text-sm">
            ← Back to products
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-sm text-gray-500">SKU: {product.sku}</p>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${
            product.stock_count <= product.reorder_level ? 'text-red-600' : 'text-green-600'
          }`}>
            {product.stock_count}
          </div>
          <div className="text-sm text-gray-500">units in stock</div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      )}

      {updateSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          ✅ {updateSuccess}
        </div>
      )}

      <div className="space-y-6">
        {/* Product Details */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Product Details</h2>

          {/* Product Image */}
          <div className="mb-6 flex justify-center">
            <div className="w-48 h-48 bg-gray-50 rounded-lg overflow-hidden">
              <img
                src={getSupabaseImageUrl(product.image_url)}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.jpeg';
                }}
              />
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="text-sm text-gray-900">{product.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">SKU</dt>
              <dd className="text-sm text-gray-900">{product.sku}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Current Stock</dt>
              <dd className={`text-sm font-semibold ${
                product.stock_count <= product.reorder_level ? 'text-red-600' : 'text-gray-900'
              }`}>
                {product.stock_count}
                {product.stock_count <= product.reorder_level && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    Low Stock
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Reorder Level</dt>
              <dd className="text-sm text-gray-900">{product.reorder_level}</dd>
            </div>
            {product.description && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="text-sm text-gray-900">{product.description}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Stock Update Form with Quick Actions */}
        <div
          id="stock-update-form"
          className={`bg-white shadow rounded-lg p-4 sm:p-6 transition-all duration-300 ${
            shouldHighlight ? 'ring-2 ring-green-500 ring-opacity-50 bg-green-50' : ''
          }`}
        >
          <h2 className="text-lg font-medium text-gray-900 mb-4">Update Stock</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stock Update Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleStockUpdate} className="space-y-4">
                <div>
                  <label htmlFor="stockChange" className="block text-sm font-medium text-gray-700">
                    Stock Change
                  </label>
                  <div className="mt-1 flex items-center space-x-2">
                    <input
                      type="number"
                      id="stockChange"
                      className="block flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:max-w-24"
                      placeholder="±0"
                      value={stockChange}
                      onChange={(e) => setStockChange(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const currentValue = parseInt(stockChange || '0');
                        setStockChange((currentValue - 1).toString());
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      ➖
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const currentValue = parseInt(stockChange || '0');
                        setStockChange((currentValue + 1).toString());
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      ➕
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Use buttons or type positive/negative numbers
                  </p>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500"
                    placeholder="Add a note about this stock change..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={updating || !stockChange}
                  className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update Stock'}
                </button>
              </form>
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {/* Left Column - Add (Plus) */}
                <div className="space-y-2">
                  <button
                    onClick={() => setStockChange('1')}
                    className="w-full px-3 py-2 text-sm text-gray-700 bg-green-50 hover:bg-green-100 rounded-md border border-green-200"
                  >
                    ➕ Add 1
                  </button>
                  <button
                    onClick={() => setStockChange('5')}
                    className="w-full px-3 py-2 text-sm text-gray-700 bg-green-50 hover:bg-green-100 rounded-md border border-green-200"
                  >
                    ➕ Add 5
                  </button>
                  <button
                    onClick={() => setStockChange('10')}
                    className="w-full px-3 py-2 text-sm text-gray-700 bg-green-50 hover:bg-green-100 rounded-md border border-green-200"
                  >
                    ➕ Add 10
                  </button>
                </div>
                {/* Right Column - Remove (Minus) */}
                <div className="space-y-2">
                  <button
                    onClick={() => setStockChange('-1')}
                    className="w-full px-3 py-2 text-sm text-gray-700 bg-red-50 hover:bg-red-100 rounded-md border border-red-200"
                  >
                    ➖ Remove 1
                  </button>
                  <button
                    onClick={() => setStockChange('-5')}
                    className="w-full px-3 py-2 text-sm text-gray-700 bg-red-50 hover:bg-red-100 rounded-md border border-red-200"
                  >
                    ➖ Remove 5
                  </button>
                  <button
                    onClick={() => setStockChange('-10')}
                    className="w-full px-3 py-2 text-sm text-gray-700 bg-red-50 hover:bg-red-100 rounded-md border border-red-200"
                  >
                    ➖ Remove 10
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code - Mobile Optimized */}
        {qrCode && (
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">QR Code</h3>
            <div className="text-center">
              <img
                src={qrCode}
                alt="Product QR Code"
                className="mx-auto w-40 h-40 sm:w-48 sm:h-48 border border-gray-200 rounded"
              />
              <p className="mt-2 text-sm text-gray-500">
                Scan this code to quickly access this product
              </p>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = qrCode;
                  link.download = `${product.sku}-qr-code.png`;
                  link.click();
                }}
                className="mt-2 text-sm text-brand-600 hover:text-brand-500"
              >
                Download QR Code
              </button>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h2>

          {transactions.length === 0 ? (
            <p className="text-gray-500 text-sm">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1 sm:mb-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        transaction.change_amount > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.change_amount > 0 ? '+' : ''}{transaction.change_amount}
                      </span>
                      <span className="text-sm text-gray-900">
                        {new Date(transaction.timestamp).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-gray-500 hidden sm:inline">
                        {new Date(transaction.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {transaction.notes && (
                      <div className="text-sm text-gray-600 mt-1">{transaction.notes}</div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 sm:mt-0 sm:text-sm">
                    {transaction.user_email}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;