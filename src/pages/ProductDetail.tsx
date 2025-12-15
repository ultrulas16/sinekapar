// src/pages/ProductDetail.tsx

import { useParams } from 'react-router-dom';
import { useState, useEffect } 'react';
import { supabase, Product } from '../lib/supabase';

// Sepet mantığı için basit bir placeholder fonksiyonu
const addToCart = (product: Product) => {
  // Gerçek bir uygulamada:
  // 1. Local Storage veya bir Context/State Yönetimi kütüphanesini kullanırsınız.
  // 2. Supabase'deki 'carts' veya 'order_items' tablosuna kayıt atarsınız.
  console.log(`${product.name} ürünü sepete eklendi! ID: ${product.id}`);
  alert(`${product.name} sepete başarıyla eklendi!`);
  // Burada gerçek sepete ekleme işlemleri yapılmalıdır.
};

function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .maybeSingle();

        if (error) throw error;

        setProduct(data);
      } catch (error) {
        console.error('Ürün yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-lg">Ürün yükleniyor...</div>;
  }

  if (!product) {
    return <div className="container mx-auto p-8 text-center text-red-500">Ürün bulunamadı veya geçersiz ID.</div>;
  }

  // Hesaplanan KDV dahil fiyatı gösterelim (basitleştirilmiş)
  const priceWithVAT = product.vat_included 
    ? product.base_price 
    : product.base_price * (1 + product.vat_rate / 100);

  return (
    <div className="container mx-auto p-8">
      <div className="bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{product.name}</h1>
        <p className="text-lg text-gray-500 mb-8">Kategori: {product.category || 'Belirtilmemiş'}</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Görsel/Placeholder Alanı */}
          <div className="lg:col-span-1 bg-gray-100 h-80 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-xl">Ürün Görseli Yer Tutucu</span>
            {/* Gerçekte burada ProductImage tablosundan çekilen görsel gösterilir */}
          </div>

          {/* Bilgi ve Sepet Alanı */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4">Ürün Detayları</h2>
            
            <p className="text-3xl font-bold text-green-600 mb-6">
              {priceWithVAT.toFixed(2)} TL 
              <span className="text-base font-normal text-gray-500 ml-2">{product.vat_included ? '(KDV Dahil)' : '(KDV Hariç: %' + product.vat_rate + ')'}</span>
            </p>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Açıklama</h3>
              <p className="text-gray-700 leading-relaxed">{product.description || 'Bu ürün için detaylı bir açıklama mevcut değildir.'}</p>
            </div>

            <div className="mb-8 p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800">
                <h3 className="text-lg font-semibold">Stok Durumu</h3>
                <p className="text-sm">{product.stock_quantity > 0 ? `Stokta: ${product.stock_quantity} adet` : 'Stokta yok.'}</p>
            </div>
            
            <button 
              onClick={() => addToCart(product)}
              disabled={product.stock_quantity <= 0}
              className={`w-full py-3 px-6 text-xl font-semibold rounded-lg transition-all 
                ${product.stock_quantity > 0 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
            >
              Sepete Ekle
            </button>
          </div>
        </div>
        
        {/* Ek Özellikler Alanı */}
        <div className="mt-10 pt-6 border-t border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Teknik Özellikler</h2>
          <pre className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap">{product.specifications || 'Teknik özellikler listelenmemiştir.'}</pre>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;