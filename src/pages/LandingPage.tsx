import { useEffect, useState } from 'react';
import { Shield, Zap, Clock, Users, Phone, Mail, MapPin, ShoppingCart } from 'lucide-react';
import { supabase, type Product, type ProductImage } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';

export default function LandingPage() {
  const { profile, user } = useAuth();
  const [products, setProducts] = useState<(Product & { images: ProductImage[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [dealerTier, setDealerTier] = useState<number>(1);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (profile?.role === 'dealer' && profile.dealer_id) {
      loadDealerTier();
    }
  }, [profile]);

  const loadDealerTier = async () => {
    if (!profile?.dealer_id) return;

    try {
      const { data, error } = await supabase
        .from('dealers')
        .select('tier')
        .eq('id', profile.dealer_id)
        .maybeSingle();

      if (error) throw error;
      if (data) setDealerTier(data.tier);
    } catch (error) {
      console.error('Error loading dealer tier:', error);
    }
  };

  const getDealerPrice = (product: Product): number => {
    switch (dealerTier) {
      case 1:
        return product.dealer_tier1_price || 0;
      case 2:
        return product.dealer_tier2_price || 0;
      case 3:
        return product.dealer_tier3_price || 0;
      default:
        return product.dealer_tier1_price || 0;
    }
  };

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

  const handleAddToCart = async (productId: string) => {
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

      <section className="bg-gradient-to-br from-teal-600 via-cyan-600 to-teal-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Profesyonel Sinek Kontrol Çözümleri
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-teal-50">
              İlaçlama firmalarına özel bayilik sistemi ve son kullanıcı satışı
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#products"
                className="px-8 py-4 bg-white text-teal-600 rounded-lg font-semibold hover:bg-teal-50 transition-all transform hover:scale-105 shadow-lg"
              >
                Ürünleri İncele
              </a>
              <a
                href="/dealer-register"
                className="px-8 py-4 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 transition-all transform hover:scale-105 shadow-lg"
              >
                Bayi Başvurusu
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Güvenilir</h3>
              <p className="text-gray-600">Sertifikalı ve test edilmiş ürünler</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-cyan-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Etkili</h3>
              <p className="text-gray-600">Yüksek performanslı teknoloji</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Hızlı Teslimat</h3>
              <p className="text-gray-600">Türkiye geneli hızlı kargo</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-cyan-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Destek</h3>
              <p className="text-gray-600">7/24 müşteri desteği</p>
            </div>
          </div>
        </div>
      </section>

      <section id="products" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Ürünlerimiz</h2>
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
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
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
                        <div>
                          <p className="text-2xl font-bold text-teal-600">
                            {profile?.role === 'dealer'
                              ? getDealerPrice(product).toLocaleString('tr-TR')
                              : (product.base_price || 0).toLocaleString('tr-TR')} ₺
                          </p>
                          {profile?.role === 'dealer' && product.base_price && (
                            <p className="text-xs text-gray-500 line-through">
                              Perakende: {product.base_price.toLocaleString('tr-TR')} ₺
                            </p>
                          )}
                          <p className="text-sm text-gray-500">Stok: {product.stock_quantity || 0} adet</p>
                        </div>
                      </div>

                      {profile?.role === 'dealer' ? (
                        <button className="w-full px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-colors flex items-center justify-center space-x-2">
                          <ShoppingCart className="w-5 h-5" />
                          <span>Bayi Siparişi Ver</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(product.id)}
                          disabled={addingToCart === product.id}
                          className="w-full px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          <ShoppingCart className="w-5 h-5" />
                          <span>{addingToCart === product.id ? 'Ekleniyor...' : 'Sepete Ekle'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="about" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Hakkımızda</h2>
            <p className="text-lg text-gray-600 mb-6">
              SineKapar, profesyonel sinek kontrol cihazları üretimi ve satışında Türkiye'nin öncü firmalarından biridir.
              İlaçlama firmalarına özel bayilik sistemi ile hizmet vermekteyiz.
            </p>
            <p className="text-lg text-gray-600">
              Ürünlerimiz, sağlık bakanlığı onaylı ve CE sertifikalıdır. Müşteri memnuniyeti ve kalite odaklı
              çalışma prensibimizle sektörde fark yaratıyoruz.
            </p>
          </div>
        </div>
      </section>

      <section id="contact" className="py-16 bg-gradient-to-br from-teal-600 to-cyan-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">İletişim</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Telefon</h3>
                <p className="text-teal-100">0533 665 22 51</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">E-posta</h3>
                <p className="text-teal-100">info@sinekapar.com</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Adres</h3>
                <p className="text-teal-100">İstanbul, Türkiye</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            &copy; 2026 SineKapar. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
}
