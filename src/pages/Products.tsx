// src/pages/Products.tsx (Güncellenmiş)

import { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { supabase, type Product, type ProductImage } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import { Link } from 'react-router-dom'; // <-- YENİ İÇE AKTARMA

export default function Products() {
  const { profile, user } = useAuth();
  const [products, setProducts] = useState<(Product & { images: ProductImage[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data: productsData, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (productsData) {
        const productsWithImages = await Promise.all(
          productsData.map(async (product) => {
            const { data: images } = await supabase
              .from('product_images')
              .select('*')
              .eq('product_id', product.id)
              .order('display_order');

            return { ...product, images: images || [] };
          })
        );

        setProducts(productsWithImages);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sepete ekleme fonksiyonu güncellendi: e (event) parametresi eklendi
  const handleAddToCart = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // <-- Bu satır, Link bileşeninin tıklanmasını engeller

    if (!user) {
      alert('Sepete eklemek için giriş yapmalısınız.');
      return;
    }

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
      alert('Hata: ' + error.message);
    } finally {
      setAddingToCart(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Ürünlerimiz</h1>
            <p className="text-xl text-gray-600">Profesyonel sinek kontrol cihazları</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Henüz ürün eklenmemiş.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                // Ürün kartını Link ile sarmalıyoruz
                <Link 
                    to={`/product/${product.id}`} // <-- Detay sayfasına yönlendirme
                    key={product.id} 
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow block" // block ekledik
                >
                  <div className="aspect-video bg-gray-200 flex items-center justify-center">
                    {product.images.find((img) => img.is_main)?.image_url || product.images[0]?.image_url ? (
                      <img
                        src={product.images.find((img) => img.is_main)?.image_url || product.images[0]?.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-6xl">🪰</span>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>

                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-2xl font-bold text-teal-600">
                            {product.base_price.toLocaleString('tr-TR')} ₺
                            {!product.vat_included && (
                              <span className="text-sm font-normal text-gray-600"> + KDV</span>
                            )}
                          </p>
                          <div className="flex flex-col text-xs text-gray-500 mt-1 space-y-0.5">
                            <span>KDV: %{product.vat_rate} {product.vat_included ? '(Dahil)' : '(Hariç)'}</span>
                            <span>Nakliye: {
                              product.shipping_option === 'standard' ? 'Standart Kargo' :
                              product.shipping_option === 'express' ? 'Hızlı Kargo' :
                              product.shipping_option === 'pickup' ? 'Mağazadan Teslimat' :
                              'Ücretsiz Kargo'
                            }</span>
                            <span>Stok: {product.stock_quantity} adet</span>
                          </div>
                        </div>
                      </div>

                      {user ? (
                        <button
                          // Tıklama olayını handleAddToCart'a gönderiyoruz
                          onClick={(e) => handleAddToCart(product.id, e)} 
                          disabled={addingToCart === product.id}
                          className="w-full px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          <ShoppingCart className="w-5 h-5" />
                          <span>{addingToCart === product.id ? 'Ekleniyor...' : 'Sepete Ekle'}</span>
                        </button>
                      ) : (
                        <div className="text-center py-2 text-sm text-gray-600 border border-gray-300 rounded-lg">
                          Sipariş vermek için giriş yapın
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            &copy; 2024 SineKapar. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
}