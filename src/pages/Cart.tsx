// src/pages/Cart.tsx

import { useState, useEffect, useCallback } from 'react';
import { supabase, type CartItemWithProduct } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import { Trash2, Loader2, Minus, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs'; // <-- EKLENDİ

export default function Cart() {
  const { user, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Sepet verilerini Supabase'den çeken fonksiyon
  const fetchCartItems = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setCartItems([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cart')
        .select(`
          id, 
          user_id, 
          product_id, 
          quantity, 
          created_at,
          product:products (
            id, name, base_price, vat_rate, vat_included, stock_quantity
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setCartItems(data as unknown as CartItemWithProduct[]);
    } catch (error) {
      console.error('Sepet öğeleri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchCartItems();
    }
  }, [authLoading, fetchCartItems]);

  // Sepet öğesi adedini güncelleyen fonksiyon
  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setActionLoading(cartItemId);
    try {
      const { error } = await supabase
        .from('cart')
        .update({ quantity: newQuantity })
        .eq('id', cartItemId);

      if (error) throw error;

      // Yerel durumu güncelle
      setCartItems(prev => prev.map(item => 
        item.id === cartItemId ? { ...item, quantity: newQuantity } : item
      ));

    } catch (error) {
      console.error('Adet güncellenirken hata:', error);
      alert('Adet güncellenirken bir hata oluştu.');
    } finally {
      setActionLoading(null);
    }
  };

  // Sepet öğesini tamamen silen fonksiyon
  const removeItem = async (cartItemId: string, productName: string) => {
    if (!confirm(`${productName} adlı ürünü sepetten silmek istediğinizden emin misiniz?`)) {
      return;
    }

    setActionLoading(cartItemId);
    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;

      // Yerel durumu güncelle
      setCartItems(prev => prev.filter(item => item.id !== cartItemId));

    } catch (error) {
      console.error('Öğe silinirken hata:', error);
      alert('Öğe silinirken bir hata oluştu.');
    } finally {
      setActionLoading(null);
    }
  };

  // Toplam sepet tutarını hesapla
  const cartTotal = cartItems.reduce((total, item) => {
    const price = item.product.vat_included
      ? item.product.base_price
      : item.product.base_price * (1 + item.product.vat_rate / 100);
    return total + price * item.quantity;
  }, 0);


  if (authLoading || loading) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <div className="flex justify-center items-center flex-grow text-lg">
                <div className="inline-block w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        </div>
    );
  }

  if (!user) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <div className="container mx-auto p-8 text-center flex-grow">
                <p className="text-2xl text-red-500 mt-10">Sepetinizi görüntülemek için giriş yapmalısınız.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <Breadcrumbs /> {/* <-- EKLENDİ */}

      <div className="container mx-auto p-4 lg:p-8 flex-grow">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-2">Sepetim</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow">
            <p className="text-xl text-gray-600 mb-4">Sepetinizde hiç ürün bulunmamaktadır.</p>
            <Link to="/products" className="text-teal-600 hover:underline font-semibold">
                Şimdi ürünleri inceleyin
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Sepet İçeriği (Sol/Orta) */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const product = item.product;
                const price = product.vat_included
                    ? product.base_price
                    : product.base_price * (1 + product.vat_rate / 100);
                
                const itemTotal = price * item.quantity;

                return (
                  <div key={item.id} className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
                    
                    {/* Görsel Placeholder */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-3xl text-gray-400">📦</span>
                    </div>

                    <div className="flex-1">
                      <Link to={`/product/${product.id}`} className="text-lg font-semibold text-gray-900 hover:text-teal-600 transition-colors">
                        {product.name}
                      </Link>
                      <p className="text-sm text-gray-500">Birim Fiyat: {price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                      {product.stock_quantity < item.quantity && (
                        <p className="text-xs text-red-500 font-semibold mt-1">Stokta yeterli ürün yok! ({product.stock_quantity} adet kaldı)</p>
                      )}
                    </div>
                    
                    {/* Adet Ayarı */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                        disabled={item.quantity <= 1 || actionLoading === item.id}
                        className="p-2 border rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-semibold w-8 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={actionLoading === item.id || item.quantity >= product.stock_quantity}
                        className="p-2 border rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Toplam Fiyat */}
                    <div className="font-bold text-lg text-teal-700 w-24 text-right flex-shrink-0">
                        {itemTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </div>

                    {/* Sil Butonu */}
                    <button 
                      onClick={() => removeItem(item.id, product.name)}
                      disabled={actionLoading === item.id}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                    >
                      {actionLoading === item.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Sipariş Özeti (Sağ) */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-lg sticky top-4">
                <h2 className="text-xl font-bold mb-4 border-b pb-2">Sipariş Özetiniz</h2>
                
                <div className="space-y-3">
                    <div className="flex justify-between text-gray-700">
                        <span>Ürün Toplamı ({cartItems.length} kalem)</span>
                        <span>{cartTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                        <span>Kargo Ücreti</span>
                        <span>Hesaplanacak</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t mt-3">
                        <span>Genel Toplam</span>
                        <span className="text-teal-700">{cartTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                    </div>
                </div>

                <Link 
                  to="/checkout" // Bir sonraki adımda oluşturulacak rota
                  className="w-full mt-6 py-3 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 transition-colors block text-center"
                >
                  Ödemeye Geç
                </Link>
                <Link to="/products" className="w-full mt-3 py-2 text-indigo-600 border border-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors block text-center">
                    Alışverişe Devam Et
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

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