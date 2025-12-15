// src/components/Header.tsx (Eksiksiz ve Güncellenmiş)

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut, Menu, X, ShoppingCart } from 'lucide-react'; // <-- ShoppingCart import edildi
import { useAuth } from '../contexts/AuthContext';
import { signOut } from '../lib/auth';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';

export default function Header() {
  const { user, profile } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getDashboardLink = () => {
    if (!profile) return '/';
    switch (profile.role) {
      case 'admin':
        return '/admin';
      case 'dealer':
        return '/dealer';
      case 'operator':
        return '/operator';
      case 'customer':
        return '/customer';
      default:
        return '/';
    }
  };

  return (
    <>
      <header className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🪰</span>
                </div>
                <span className="text-2xl font-bold">SineKapar</span>
              </Link>

              <nav className="hidden md:flex items-center space-x-6">
                <Link to="/" className="hover:text-teal-100 transition-colors">Ana Sayfa</Link>
                <Link to="/products" className="hover:text-teal-100 transition-colors">Ürünler</Link>
                <Link to="/about" className="hover:text-teal-100 transition-colors">Hakkımızda</Link>
                <Link to="/contact" className="hover:text-teal-100 transition-colors">İletişim</Link>
              </nav>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  {/* MASAÜSTÜ SEPET İKONU */}
                  <Link 
                    to="/cart" 
                    className="flex items-center space-x-1 hover:text-teal-100 transition-colors"
                  >
                    <ShoppingCart className="w-6 h-6" />
                  </Link>
                  
                  <Link
                    to={getDashboardLink()}
                    className="flex items-center space-x-2 hover:text-teal-100 transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span>{profile?.full_name || 'Profil'}</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 px-4 py-2 bg-white text-teal-600 rounded-lg hover:bg-teal-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Çıkış</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowLogin(true)}
                    className="px-4 py-2 hover:text-teal-100 transition-colors"
                  >
                    Giriş Yap
                  </button>
                  <button
                    onClick={() => setShowRegister(true)}
                    className="px-4 py-2 bg-white text-teal-600 rounded-lg hover:bg-teal-50 transition-colors"
                  >
                    Kayıt Ol
                  </button>
                  <Link
                    to="/dealer-register"
                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                  >
                    Bayi Ol
                  </Link>
                </>
              )}
            </div>

            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-teal-500">
              <nav className="flex flex-col space-y-3">
                <Link to="/" className="hover:text-teal-100 transition-colors" onClick={() => setMobileMenuOpen(false)}>Ana Sayfa</Link>
                <Link to="/products" className="hover:text-teal-100 transition-colors" onClick={() => setMobileMenuOpen(false)}>Ürünler</Link>
                <Link to="/about" className="hover:text-teal-100 transition-colors" onClick={() => setMobileMenuOpen(false)}>Hakkımızda</Link>
                <Link to="/contact" className="hover:text-teal-100 transition-colors" onClick={() => setMobileMenuOpen(false)}>İletişim</Link>

                {user ? (
                  <>
                    {/* MOBİL SEPET LİNKİ */}
                    <Link 
                      to="/cart" 
                      className="flex items-center space-x-2 hover:text-teal-100 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>Sepetim</span>
                    </Link>

                    <Link
                      to={getDashboardLink()}
                      className="flex items-center space-x-2 hover:text-teal-100 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="w-5 h-5" />
                      <span>{profile?.full_name || 'Profil'}</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 text-left hover:text-teal-100 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Çıkış</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setShowLogin(true);
                        setMobileMenuOpen(false);
                      }}
                      className="text-left hover:text-teal-100 transition-colors"
                    >
                      Giriş Yap
                    </button>
                    <button
                      onClick={() => {
                        setShowRegister(true);
                        setMobileMenuOpen(false);
                      }}
                      className="text-left hover:text-teal-100 transition-colors"
                    >
                      Kayıt Ol
                    </button>
                    <Link
                      to="/dealer-register"
                      className="text-left hover:text-teal-100 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Bayi Ol
                    </Link>
                  </>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      )}

      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSwitchToLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}
    </>
  );
}