// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute'; 
import LandingPage from './pages/LandingPage';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail'; 
import Cart from './pages/Cart'; 
import Checkout from './pages/Checkout'; // <-- EKLENDİ
import About from './pages/About';
import Contact from './pages/Contact';
import DealerRegister from './pages/DealerRegister';
import AdminDashboard from './pages/AdminDashboard';
import DealerDashboard from './pages/DealerDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Halk Açık Rotalar */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:productId" element={<ProductDetail />} /> 
          <Route path="/cart" element={<Cart />} /> 
          <Route path="/checkout" element={<Checkout />} /> {/* <-- EKLENDİ */}
          
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/dealer-register" element={<DealerRegister />} />
          
          {/* Korumalı Rotalar */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="admin"> 
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/dealer" 
            element={
              <ProtectedRoute requiredRole={['dealer', 'operator']}>
                <DealerDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Bulunamayan tüm rotalar ana sayfaya yönlendirilir */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;