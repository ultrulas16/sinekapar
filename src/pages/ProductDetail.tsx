// src/pages/ProductDetail.tsx (Tasarım Tutarlılığı İçin Güncellenmiş Versiyon)

import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase, type Product, type ProductImage } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header'; // <-- Ortak Header
import { ShoppingCart } from 'lucide-react';

// Sepete ekleme mantığı
const handleAddToCart = async (user: any, productId: string, setAddingToCart: (id: string | null) => void) => {
    if (!user) {
        alert('Sepete eklemek için giriş yapmalısınız.');
        return;
    }
    // ... (Sepete ekleme mantığı aynı kalacak)
    setAddingToCart(productId);
    try {
        const { data: existingItem } = await supabase
            .from('cart')
            .select('*')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .maybeSingle();

        if (existingItem) {
            const { error } = await supabase
                .from('cart')
                .update({ quantity: existingItem.quantity + 1 })
                .eq('id', existingItem.id);

            if (error) throw error;
        } else {
            const { error } = await supabase.from('cart').insert({
                user_id: user.id,
                product_id: productId,
                quantity: 1,
            });

            if (error) throw error;
        }

        alert('Ürün sepete eklendi!');
    } catch (error: any) {
        console.error('Sepete eklerken hata:', error);
        alert('Hata: ' + (error.message || 'Bilinmeyen bir hata oluştu.'));
    } finally {
        setAddingToCart(null);
    }
};


export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<(Product & { images: ProductImage[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setLoading(false);
        return;
      }
      
      try {
        const { data: productData, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .maybeSingle();

        if (error) throw error;

        if (productData) {
            const { data: images } = await supabase
              .from('product_images')
              .select('*')
              .eq('product_id', productData.id)
              .order('display_order');
            
            setProduct({ ...productData, images: images || [] });
        } else {
            setProduct(null);
        }
      } catch (error) {
        console.error('Ürün yüklenirken hata:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Loading ve Bulunamadı durumları da Header ve Footer'ı içermeli
  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <div className="flex justify-center items-center flex-grow text-lg">
                <div className="inline-block w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <footer className="bg-gray-900 text-white py-8 mt-auto"> {/* Footer'ı en alta sabitle */}
              <div className="container mx-auto px-4 text-center">
                <p className="text-gray-400"> &copy; 2024 SineKapar. Tüm hakları saklıdır.</p>
              </div>
            </footer>
        </div>
    );
  }

  if (!product) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <div className="container mx-auto p-8 text-center flex-grow">
                <p className="text-2xl text-red-500 mt-10">Ürün bulunamadı veya geçersiz ID.</p>
            </div>
            <footer className="bg-gray-900 text-white py-8 mt-auto"> {/* Footer'ı en alta sabitle */}
              <div className="container mx-auto px-4 text-center">
                <p className="text-gray-400"> &copy; 2024 SineKapar. Tüm hakları saklıdır.</p>
              </div>
            </footer>
        </div>
    );
  }

  const mainImage = product.images.find((img) => img.is_main) || product.images[0];
  
  const priceDisplay = product.base_price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
  const vatStatus = product.vat_included ? '(KDV Dahil)' : `(KDV Hariç: %${product.vat_rate})`;

  return (
    // min-h-screen bg-gray-50 flex flex-col sınıfları tutarlılık için kalmalı
    <div className="min-h-screen bg-gray-50 flex flex-col"> 
        <Header />

        {/* Ana içerik alanını Products.tsx'teki <section> etiketine benzer şekilde yapalım. */}
        <section className="py-12 flex-grow"> 
            <div className="container mx-auto px-4"> {/* Products.tsx'teki konteyner sınıfı */}
                <div className="bg-white shadow-xl rounded-xl p-8 lg:p-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        
                        {/* Ürün Görseli Alanı */}
                        <div className="lg:col-span-1">
                            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                                {mainImage ? (
                                    <img
                                        src={mainImage.image_url}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-8xl text-gray-400">📷</span>
                                )}
                            </div>
                        </div>

                        {/* Bilgi ve Sepet Alanı */}
                        <div className="lg:col-span-1">
                            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{product.name}</h1>
                            <p className="text-sm text-gray-500 mb-6">SKU: {product.sku || 'Yok'}</p>
                            
                            <div className="mb-6 border-b pb-4">
                                <p className="text-4xl font-bold text-teal-600">
                                    {priceDisplay}
                                </p>
                                <span className="text-md font-normal text-gray-500 mt-1 block">
                                    KDV: %{product.vat_rate} {vatStatus}
                                </span>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-xl font-semibold mb-2 text-gray-800">Ürün Açıklaması</h3>
                                <p className="text-gray-700 leading-relaxed">{product.description || 'Detaylı bir açıklama mevcut değildir.'}</p>
                            </div>

                            <div className="flex items-center space-x-4 mb-8">
                                <div className={`p-2 rounded-full text-white ${product.stock_quantity > 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                                    <span className="text-sm font-semibold">
                                        {product.stock_quantity > 0 ? `Stokta: ${product.stock_quantity} adet` : 'Stokta Yok'}
                                    </span>
                                </div>
                                <span className="text-sm text-gray-600">Nakliye: {
                                    product.shipping_option === 'standard' ? 'Standart Kargo' :
                                    product.shipping_option === 'express' ? 'Hızlı Kargo' :
                                    product.shipping_option === 'pickup' ? 'Mağazadan Teslimat' :
                                    'Ücretsiz Kargo'
                                }</span>
                            </div>
                            
                            {user ? (
                                <button 
                                    onClick={() => handleAddToCart(user, product.id, setAddingToCart)}
                                    disabled={product.stock_quantity <= 0 || addingToCart === product.id}
                                    className={`w-full py-3 px-6 text-xl font-semibold rounded-lg transition-all flex items-center justify-center space-x-2 
                                    ${product.stock_quantity > 0 
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                                        : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                    } disabled:opacity-50`}
                                >
                                    <ShoppingCart className="w-6 h-6" />
                                    <span>{addingToCart === product.id ? 'Ekleniyor...' : 'Sepete Ekle'}</span>
                                </button>
                            ) : (
                                <div className="text-center py-3 text-lg text-gray-600 bg-gray-100 border border-gray-300 rounded-lg">
                                    Sepete eklemek için lütfen giriş yapın.
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Teknik Özellikler Alanı */}
                    <div className="mt-12 pt-8 border-t border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Teknik Özellikler</h2>
                        <pre className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap text-gray-700 leading-6">
                            {product.specifications || 'Teknik özellikler listelenmemiştir.'}
                        </pre>
                    </div>
                </div>
            </div>
        </section>

        <footer className="bg-gray-900 text-white py-8"> {/* Footer sınıfı Products.tsx ile aynı */}
            <div className="container mx-auto px-4 text-center">
            <p className="text-gray-400">
                &copy; 2024 SineKapar. Tüm hakları saklıdır.
            </p>
            </div>
        </footer>
    </div>
  );
}