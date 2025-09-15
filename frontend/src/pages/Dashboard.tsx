import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SupabaseService } from '../services/supabaseService';
import { Product, Transaction } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    totalValue: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all data in parallel using direct Supabase queries
        const [productsData, lowStockProductsData, transactionsData] = await Promise.all([
          SupabaseService.getProducts(),
          SupabaseService.getLowStockProducts(),
          SupabaseService.getTransactions(10),
        ]);

        // Calculate stats
        const totalProducts = productsData.length;
        const lowStockCount = lowStockProductsData.length;

        setStats({
          totalProducts,
          lowStockCount,
          totalValue: 0, // You could calculate this based on product values
        });

        setLowStockProducts(lowStockProductsData);
        setRecentTransactions(transactionsData.slice(0, 5));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Set up real-time updates
    const unsubscribe = SupabaseService.subscribeToProducts(() => {
      fetchDashboardData();
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-700">
          Welcome to your warehouse management system
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">📦</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Products
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalProducts}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">⚠️</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Low Stock Items
                  </dt>
                  <dd className={`text-lg font-medium ${stats.lowStockCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {stats.lowStockCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">📊</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Recent Transactions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {recentTransactions.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="text-xl">⚠️</div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Low Stock Alert
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>The following products are running low:</p>
                <ul className="list-disc list-inside mt-1">
                  {lowStockProducts.slice(0, 3).map((product) => (
                    <li key={product.id}>
                      {product.name} (SKU: {product.sku}) - {product.stock_count} remaining
                    </li>
                  ))}
                  {lowStockProducts.length > 3 && (
                    <li>... and {lowStockProducts.length - 3} more</li>
                  )}
                </ul>
              </div>
              <div className="mt-4">
                <Link
                  to="/products"
                  className="text-sm font-medium text-red-800 hover:text-red-600"
                >
                  View all products →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Future Features Placeholder */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
            More Features Coming Soon
          </h3>
          <p className="text-sm text-gray-500">
            This space is reserved for future dashboard enhancements like analytics, reports, and more!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;