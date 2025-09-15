import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Lazy load components to reduce initial bundle size
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ProductList = React.lazy(() => import('./pages/ProductList'));
const ProductDetail = React.lazy(() => import('./pages/ProductDetail'));
const AddProduct = React.lazy(() => import('./pages/AddProduct'));
const TransactionHistory = React.lazy(() => import('./pages/TransactionHistory'));
const QRScanner = React.lazy(() => import('./pages/QRScanner'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <ProtectedRoute>
          <Layout>
            <Suspense fallback={
              <div className="flex justify-center items-center h-64">
                <div className="text-lg text-gray-600">Loading...</div>
              </div>
            }>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/products/add" element={<AddProduct />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/transactions" element={<TransactionHistory />} />
                <Route path="/scan" element={<QRScanner />} />
              </Routes>
            </Suspense>
          </Layout>
        </ProtectedRoute>
      </Router>
    </AuthProvider>
  );
}

export default App;
