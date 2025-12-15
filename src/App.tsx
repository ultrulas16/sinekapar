// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
// Not: Bu bileşeni oluşturduğunuzu varsayıyorum.
import { ProtectedRoute } from './components/ProtectedRoute'; 
import LandingPage from './pages/LandingPage';
import Products from './pages/Products';
// Yeni eklenen ProductDetail sayfasını içe aktarın.
import ProductDetail from './pages/ProductDetail'; 
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
          
          {/* Ürün Detay Sayfası Rotosu */}
          <Route path="/product/:productId" element={<ProductDetail />} /> {/* <-- EKLENDİ */}

          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/dealer-register" element={<DealerRegister />} />
          
          {/* Korumalı Rotalar: Admin */}
          <Route 
            path="/admin" 
            element={
              // Not: UserRole tipi, src/lib/supabase.ts dosyasında tanımlı olmalıdır.
              <ProtectedRoute requiredRole="admin"> 
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Korumalı Rotalar: Dealer/Operator */}
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