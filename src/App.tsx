// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute'; // Yeni bileşeni içe aktar
import LandingPage from './pages/LandingPage';
import Products from './pages/Products';
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
          <Route path="/" element={<LandingPage />} />
          <Route path="/products" element={<Products />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/dealer-register" element={<DealerRegister />} />
          
          {/* YENİ GELİŞTİRME: Admin rotasını koruma altına alma */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="admin"> 
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* YENİ GELİŞTİRME: Dealer rotasını koruma altına alma */}
          <Route 
            path="/dealer" 
            element={
              <ProtectedRoute requiredRole={['dealer', 'operator']}> {/* Hem dealer hem de operator erişebilir */}
                <DealerDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;