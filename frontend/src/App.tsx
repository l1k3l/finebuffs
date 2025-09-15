import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import AddProduct from './pages/AddProduct';
import TransactionHistory from './pages/TransactionHistory';
import QRScanner from './pages/QRScanner';
import PerformanceMonitor from './pages/PerformanceMonitor';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/add" element={<AddProduct />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/transactions" element={<TransactionHistory />} />
              <Route path="/scan" element={<QRScanner />} />
              <Route path="/performance" element={<PerformanceMonitor />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      </Router>
    </AuthProvider>
  );
}

export default App;
