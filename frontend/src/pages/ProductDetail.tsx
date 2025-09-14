import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createApiClient } from '../lib/api';
import { Product, Transaction } from '../types';

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
        <Link to="/products" className="text-indigo-600 hover:text-indigo-500">
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
          <Link to="/products" className="text-indigo-600 hover:text-indigo-500 text-sm">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Product Details</h2>

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

          {/* Stock Update Form */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Update Stock</h2>

            <form onSubmit={handleStockUpdate} className="space-y-4">
              <div>
                <label htmlFor="stockChange" className="block text-sm font-medium text-gray-700">
                  Stock Change
                </label>
                <div className="mt-1 flex items-center space-x-2">
                  <input
                    type="number"
                    id="stockChange"
                    className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="±0"
                    value={stockChange}
                    onChange={(e) => setStockChange(e.target.value)}
                    required
                  />
                  <span className="text-sm text-gray-500">
                    (Use positive numbers to add stock, negative to remove)
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add a note about this stock change..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={updating || !stockChange}
                className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update Stock'}
              </button>
            </form>
          </div>

          {/* Transaction History */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h2>

            {transactions.length === 0 ? (
              <p className="text-gray-500 text-sm">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <div className="flex items-center space-x-2">
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
                        <span className="text-sm text-gray-500">
                          {new Date(transaction.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {transaction.notes && (
                        <div className="text-sm text-gray-600 mt-1">{transaction.notes}</div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.user_email}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* QR Code */}
          {qrCode && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">QR Code</h3>
              <div className="text-center">
                <img
                  src={qrCode}
                  alt="Product QR Code"
                  className="mx-auto w-48 h-48 border border-gray-200 rounded"
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
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Download QR Code
                </button>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => setStockChange('10')}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
              >
                ➕ Add 10 units
              </button>
              <button
                onClick={() => setStockChange('5')}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
              >
                ➕ Add 5 units
              </button>
              <button
                onClick={() => setStockChange('1')}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
              >
                ➕ Add 1 unit
              </button>
              <hr className="my-2" />
              <button
                onClick={() => setStockChange('-1')}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
              >
                ➖ Remove 1 unit
              </button>
              <button
                onClick={() => setStockChange('-5')}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
              >
                ➖ Remove 5 units
              </button>
              <button
                onClick={() => setStockChange('-10')}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
              >
                ➖ Remove 10 units
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;