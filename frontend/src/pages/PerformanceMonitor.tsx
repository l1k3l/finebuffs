import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePerformanceTracking } from '../services/performanceService';
import { createPerformanceTestRunner } from '../services/performanceTestRunner';
import { useAuth } from '../contexts/AuthContext';

const PerformanceMonitor: React.FC = () => {
  const { comparePerformance, generateReport, clearMetrics } = usePerformanceTracking();
  const { getAccessToken } = useAuth();
  const [operations] = useState<string[]>([
    'fetch-products',
    'fetch-product-detail',
    'fetch-all-transactions',
    'fetch-product-transactions',
    'fetch-low-stock-products',
    'search-products'
  ]);
  const [report, setReport] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testReport, setTestReport] = useState<string>('');
  const [testIterations, setTestIterations] = useState(10);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateReport = useCallback(() => {
    setReport(generateReport());
  }, [generateReport]);

  // Initial load
  useEffect(() => {
    updateReport();
  }, [updateReport]);

  // Auto-refresh effect with proper cleanup
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        // Only update if component is still mounted and on performance page
        if (window.location.pathname === '/performance') {
          updateReport();
        }
      }, 5000);
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, updateReport]);

  // Run comprehensive performance test
  const runPerformanceTest = async () => {
    setIsRunningTest(true);
    setTestReport('');

    try {
      const testRunner = createPerformanceTestRunner(getAccessToken);
      const results = await testRunner.runComprehensiveTest(undefined, testIterations);
      const detailedReport = testRunner.generateDetailedReport(results);
      setTestReport(detailedReport);
    } catch (error) {
      setTestReport(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunningTest(false);
    }
  };

  const renderComparisonCard = (operation: string) => {
    const comparison = comparePerformance(operation);

    if (!comparison.directSupabase && !comparison.backendApi) {
      return (
        <div key={operation} className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-700 mb-2">{operation.replace(/-/g, ' ').toUpperCase()}</h3>
          <p className="text-sm text-gray-500">No measurements yet</p>
        </div>
      );
    }

    const directStats = comparison.directSupabase;
    const apiStats = comparison.backendApi;

    return (
      <div key={operation} className="bg-white border rounded-lg p-6 shadow-sm">
        <h3 className="font-medium text-gray-900 mb-4 flex items-center">
          {operation.replace(/-/g, ' ').toUpperCase()}
          {comparison.improvement && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              {comparison.improvement.avgSpeedup.toFixed(1)}x faster
            </span>
          )}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Direct Supabase Stats */}
          {directStats && (
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium text-blue-900 mb-2">Direct Supabase</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Average:</span>
                  <span className="font-medium">{directStats.avg.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">P95:</span>
                  <span className="font-medium">{directStats.p95.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recent:</span>
                  <span className="font-medium">{directStats.recent.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Samples:</span>
                  <span className="font-medium">{directStats.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="font-medium">{(directStats.successRate * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Backend API Stats */}
          {apiStats && (
            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-medium text-orange-900 mb-2">Backend API</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Average:</span>
                  <span className="font-medium">{apiStats.avg.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">P95:</span>
                  <span className="font-medium">{apiStats.p95.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recent:</span>
                  <span className="font-medium">{apiStats.recent.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Samples:</span>
                  <span className="font-medium">{apiStats.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="font-medium">{(apiStats.successRate * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Improvement Summary */}
        {comparison.improvement && (
          <div className="mt-4 p-3 bg-green-50 rounded-md">
            <div className="flex items-center">
              <span className="text-green-800 text-sm font-medium">
                🚀 Performance Improvement: {comparison.improvement.percentImprovement.toFixed(1)}% faster
                ({comparison.improvement.avgSpeedup.toFixed(2)}x speedup)
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Monitor</h1>
          <p className="mt-2 text-sm text-gray-700">
            Real-time performance comparison between Direct Supabase and Backend API
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="ml-2 text-sm text-gray-700">Auto-refresh</span>
          </label>
          <button
            onClick={() => {
              clearMetrics();
              setReport('');
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Clear Data
          </button>
        </div>
      </div>

      {/* Warning Message */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-yellow-400">⚠️</span>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Usage Instructions:</strong> Navigate to different pages (Products, Dashboard, Transaction History)
              to generate performance measurements. Data includes cache-busting to ensure accurate timing.
            </p>
          </div>
        </div>
      </div>

      {/* Automated Performance Test Runner */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">🧪 Automated Performance Comparison</h3>
          <p className="text-sm text-gray-500 mt-1">
            Run controlled tests comparing Direct Supabase vs Backend API methods
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div>
              <label htmlFor="iterations" className="block text-sm font-medium text-gray-700 mb-1">
                Test Iterations
              </label>
              <input
                type="number"
                id="iterations"
                min="5"
                max="50"
                value={testIterations}
                onChange={(e) => setTestIterations(Math.max(5, Math.min(50, parseInt(e.target.value) || 10)))}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500"
                disabled={isRunningTest}
              />
              <p className="text-xs text-gray-500 mt-1">5-50 iterations per test</p>
            </div>
            <div className="flex-1">
              <button
                onClick={runPerformanceTest}
                disabled={isRunningTest}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  isRunningTest
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isRunningTest ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Running Tests...
                  </span>
                ) : (
                  '🚀 Run Comprehensive Test'
                )}
              </button>
            </div>
          </div>

          {isRunningTest && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Running Performance Tests</p>
                  <p className="text-xs text-blue-700">
                    Testing {testIterations} iterations each of: Products, Transactions, Low Stock, Product Details
                  </p>
                </div>
              </div>
            </div>
          )}

          {testReport && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">📊 Test Results</h4>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded border overflow-x-auto max-h-96">
                {testReport}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 gap-6">
        {operations.map(operation => renderComparisonCard(operation))}
      </div>

      {/* Raw Report */}
      {report && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Detailed Performance Report</h3>
          </div>
          <div className="p-6">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded overflow-x-auto">
              {report}
            </pre>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">How to Use This Monitor</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• <strong>Navigate the app</strong> - Visit Products, Dashboard, and Transaction History pages</p>
          <p>• <strong>Perform searches</strong> - Search for products to measure search performance</p>
          <p>• <strong>View specific products</strong> - Click on product details to measure detail page loading</p>
          <p>• <strong>Compare methods</strong> - The system automatically compares Direct Supabase vs Backend API calls</p>
          <p>• <strong>Cache busting</strong> - All measurements include cache-busting parameters for accuracy</p>
          <p>• <strong>Network detection</strong> - Network conditions are automatically detected and included in reports</p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;