import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createApiClient } from '../lib/api';
import { Transaction } from '../types';

const TransactionHistory: React.FC = () => {
  const { getAccessToken } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTransactions = useCallback(async () => {
    try {
      const api = createApiClient(getAccessToken);
      const response = await api.getTransactions(100); // Get more transactions for history
      setTransactions(response.transactions);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading transaction history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
        <p className="mt-2 text-sm text-gray-700">
          View all inventory changes and stock movements
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      )}

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
          <p className="text-gray-500">
            Stock changes will appear here as you update your inventory
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Recent Activity ({transactions.length} transactions)
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Change Amount Badge */}
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      transaction.change_amount > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.change_amount > 0 ? '+' : ''}{transaction.change_amount}
                    </span>

                    {/* Product Info */}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.product_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        SKU: {transaction.product_sku}
                      </div>
                    </div>
                  </div>

                  {/* Date and User */}
                  <div className="text-right">
                    <div className="text-sm text-gray-900">
                      {new Date(transaction.timestamp).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(transaction.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      by {transaction.user_email}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {transaction.notes && (
                  <div className="mt-2 ml-16">
                    <div className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                      💬 {transaction.notes}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {transactions.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {transactions.filter(t => t.change_amount > 0).length}
              </div>
              <div className="text-sm text-gray-500">Stock Additions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {transactions.filter(t => t.change_amount < 0).length}
              </div>
              <div className="text-sm text-gray-500">Stock Removals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Math.abs(transactions.reduce((sum, t) => sum + t.change_amount, 0))}
              </div>
              <div className="text-sm text-gray-500">Net Change</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;