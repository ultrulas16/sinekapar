// src/components/ProtectedRoute.tsx

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../lib/supabase';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[];
}

// Basit bir Yükleniyor bileşeni (TailwindCSS kullanılarak özelleştirilebilir)
const LoadingScreen = () => (
  <div className="flex justify-center items-center h-screen text-lg">
    Yükleniyor...
  </div>
);

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  // 1. Yükleniyor Durumu
  if (loading) {
    return <LoadingScreen />;
  }

  // 2. Oturum Açma Kontrolü
  // Eğer kullanıcı yoksa, anasayfaya yönlendir (veya bir Login sayfasına)
  if (!user) {
    // '/login' sayfasına yönlendirme daha uygun olabilir
    return <Navigate to="/" replace />;
  }
  
  // 3. Profil Yükleme Kontrolü
  // Kullanıcı var ama profil henüz yüklenmediyse (veya bir hata olduysa), yükleniyor göster
  if (!profile) {
    return <LoadingScreen />;
  }

  // 4. Rol Kontrolü (Yetkilendirme)
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    // Eğer kullanıcının rolü, gerekli rollerden biri değilse
    if (!roles.includes(profile.role)) {
      // Yetkisiz erişim için anasayfaya yönlendir
      console.warn(`Unauthorized access attempt. User role: ${profile.role}, Required roles: ${roles.join(', ')}`);
      return <Navigate to="/" replace />;
    }
  }

  // Tüm kontroller başarılı, çocuk bileşeni render et
  return <>{children}</>;
}