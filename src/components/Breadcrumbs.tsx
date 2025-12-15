// src/components/Breadcrumbs.tsx

import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import React from 'react';

// URL parçalarını okunabilir hale getiren ve özelleştiren yardımcı fonksiyon
const nameMap: { [key: string]: string } = {
  'products': 'Ürünler',
  'about': 'Hakkımızda',
  'contact': 'İletişim',
  'dealer-register': 'Bayi Kayıt',
  'admin': 'Yönetici Paneli',
  'dealer': 'Bayi Paneli',
  'cart': 'Sepetim',
  'product': 'Ürün Detayı', 
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="text-sm font-medium text-gray-500 bg-white shadow-sm py-3 border-b">
      <div className="container mx-auto px-4 flex items-center space-x-2">
        
        {/* Ana Sayfa Linki */}
        <Link to="/" className="text-teal-600 hover:text-teal-800 transition-colors">
          Ana Sayfa
        </Link>
        
        {pathnames.map((value, index) => {
          const isLast = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          
          let displayName = nameMap[value] || value;
          
          // Eğer parça ürün ID'si gibi dinamik bir değerse (/product/ID)
          // ve bir önceki parça 'product' ise, o parçayı atla.
          if (pathnames[index - 1] === 'product' && index > 0 && !nameMap[value]) {
            return null;
          }

          // Eğer dinamik ID parçası atlanıyorsa, link adı 'Ürün Detayı' olmalı
          if (pathnames[index - 1] === 'product' && index > 0) {
            displayName = nameMap['product'];
          }

          return (
            <React.Fragment key={to}>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              {isLast ? (
                <span className="text-gray-700">
                  {displayName}
                </span>
              ) : (
                <Link to={to} className="text-teal-600 hover:text-teal-800 transition-colors">
                  {displayName}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}