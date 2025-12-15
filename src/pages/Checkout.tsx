// src/pages/Checkout.tsx

import { useState, useEffect, useCallback } from 'react';
import { supabase, type CartItemWithProduct, type Address } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Loader2, CreditCard, Home, Truck } from 'lucide-react';

// Demo Adres Verileri (Gerçekte Supabase'den çekilmeli)
const DUMMY_ADDRESSES: Address[] = [
    { id: '1', user_id: '', title: 'Ev Adresim', full_name: 'Ahmet Yılmaz', phone: '5551234567', city: 'İstanbul', district: 'Kadıköy', full_address: 'Örnek Mah. No:1, Kat:2', is_default: true, created_at: new Date().toISOString() },
    { id: '2', user_id: '', title: 'İş Adresim', full_name: 'Ahmet Yılmaz', phone: '5559876543', city: 'Ankara', district: 'Çankaya', full_address: 'Ticaret Merkezi, 5. Kat', is_default: false, created_at: new Date().toISOString() },
];

export default function Checkout() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
    const [addresses] = useState<Address[]>(DUMMY_ADDRESSES); // Gerçekte fetchAddresses kullanılmalı
    const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<string | null>(DUMMY_ADDRESSES[0]?.id || null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer' | 'cod'>('card');
    const [shippingOption, setShippingOption] = useState<'standard' | 'express'>('standard');

    // Kargo ücretleri
    const SHIPPING_FEES = {
        standard: 15.00,
        express: 45.00,
    };

    const fetchCartAndAddresses = useCallback(async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        setLoading(true);
        try {
            // Sepet Verilerini Çekme
            const { data: cartData, error: cartError } = await supabase
                .from('cart')
                .select(`id, user_id, product_id, quantity, created_at, product:products (id, name, base_price, vat_rate, vat_included, stock_quantity)`)
                .eq('user_id', user.id);

            if (cartError) throw cartError;
            
            const fetchedItems = cartData as unknown as CartItemWithProduct[];
            if (fetchedItems.length === 0) {
                alert('Sepetiniz boş. Lütfen ürün ekleyin.');
                navigate('/products');
                return;
            }
            setCartItems(fetchedItems);

            if (DUMMY_ADDRESSES.length > 0 && !selectedShippingAddressId) {
                setSelectedShippingAddressId(DUMMY_ADDRESSES[0].id);
            }

        } catch (error) {
            console.error('Veri yüklenirken hata:', error);
            alert('Ödeme verileri yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    }, [user, navigate, selectedShippingAddressId]);

    useEffect(() => {
        if (!authLoading) {
            fetchCartAndAddresses();
        }
    }, [authLoading, fetchCartAndAddresses]);

    // Toplam hesaplamaları
    const subtotal = cartItems.reduce((total, item) => {
        const price = item.product.vat_included
            ? item.product.base_price
            : item.product.base_price * (1 + item.product.vat_rate / 100);
        return total + price * item.quantity;
    }, 0);
    
    const shippingFee = SHIPPING_FEES[shippingOption];
    const totalAmount = subtotal + shippingFee;

    const handleSubmitOrder = async () => {
        if (!user || !selectedShippingAddressId || cartItems.length === 0) {
            alert('Lütfen tüm alanları doldurun ve sepetinizi kontrol edin.');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Order (Sipariş) Tablosuna Ana Kaydı Ekleme
            const orderRecord = {
                user_id: user.id,
                shipping_address_id: selectedShippingAddressId,
                billing_address_id: selectedShippingAddressId,
                status: 'pending' as const,
                total_amount: totalAmount,
                vat_amount: 0, 
                shipping_fee: shippingFee,
                payment_method: paymentMethod,
                payment_status: 'pending' as const,
                shipping_option: shippingOption,
            };

            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert(orderRecord)
                .select()
                .single();

            if (orderError) throw orderError;
            const newOrderId = orderData.id;

            // 2. Order Items (Sipariş Öğeleri) Tablosuna Sepet İçeriğini Ekleme
            const orderItemsRecords = cartItems.map(item => ({
                order_id: newOrderId,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.product.base_price,
                unit_vat_rate: item.product.vat_rate,
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItemsRecords);

            if (itemsError) throw itemsError;

            // 3. Sepeti Temizleme
            await supabase
                .from('cart')
                .delete()
                .eq('user_id', user.id);

            alert(`Siparişiniz başarıyla alındı! Sipariş No: ${newOrderId}`);
            navigate(`/order/${newOrderId}`); 

        } catch (error: any) {
            console.error('Sipariş verilirken hata:', error);
            alert('Sipariş verme işlemi başarısız oldu: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header />
                <div className="flex justify-center items-center flex-grow text-lg">
                    <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
                </div>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header />
                <Breadcrumbs />
                <div className="container mx-auto p-8 text-center flex-grow">
                    <p className="text-2xl text-gray-600 mt-10">Sepetiniz boş.</p>
                    <Link to="/products" className="text-indigo-600 hover:underline">Ürünlere geri dön</Link>
                </div>
            </div>
        );
    }

    const selectedAddress = addresses.find(a => a.id === selectedShippingAddressId);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <Breadcrumbs />

            <div className="container mx-auto p-4 lg:p-8 flex-grow">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-2">Ödeme Sayfası</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Sol Sütun: Adres, Kargo ve Ödeme Seçenekleri */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* 1. Adres Seçimi */}
                        <div className="bg-white p-6 rounded-xl shadow">
                            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2 text-indigo-600">
                                <Home className="w-5 h-5" />
                                <span>Teslimat Adresi</span>
                            </h2>
                            
                            {addresses.length === 0 ? (
                                <p className="text-red-500">Lütfen bir adres ekleyin.</p>
                            ) : (
                                <div className="space-y-3">
                                    {addresses.map(addr => (
                                        <div 
                                            key={addr.id} 
                                            onClick={() => setSelectedShippingAddressId(addr.id)}
                                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                                selectedShippingAddressId === addr.id ? 'border-indigo-600 ring-2 ring-indigo-100 bg-indigo-50' : 'hover:border-gray-400'
                                            }`}
                                        >
                                            <p className="font-semibold">{addr.title} - {addr.full_name}</p>
                                            <p className="text-sm text-gray-600">{addr.full_address}, {addr.district}/{addr.city}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. Kargo Seçeneği */}
                        <div className="bg-white p-6 rounded-xl shadow">
                            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2 text-indigo-600">
                                <Truck className="w-5 h-5" />
                                <span>Kargo Yöntemi</span>
                            </h2>
                            <div className="flex space-x-4">
                                <button 
                                    onClick={() => setShippingOption('standard')}
                                    className={`py-3 px-6 border rounded-lg transition-all ${shippingOption === 'standard' ? 'border-teal-600 ring-2 ring-teal-100 bg-teal-50' : 'hover:border-gray-400'}`}
                                >
                                    <p className="font-semibold">Standart Kargo</p>
                                    <p className="text-sm text-gray-500">{SHIPPING_FEES.standard.toFixed(2)} TL</p>
                                </button>
                                <button 
                                    onClick={() => setShippingOption('express')}
                                    className={`py-3 px-6 border rounded-lg transition-all ${shippingOption === 'express' ? 'border-teal-600 ring-2 ring-teal-100 bg-teal-50' : 'hover:border-gray-400'}`}
                                >
                                    <p className="font-semibold">Hızlı Kargo</p>
                                    <p className="text-sm text-gray-500">{SHIPPING_FEES.express.toFixed(2)} TL</p>
                                </button>
                            </div>
                        </div>

                        {/* 3. Ödeme Yöntemi */}
                        <div className="bg-white p-6 rounded-xl shadow">
                            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2 text-indigo-600">
                                <CreditCard className="w-5 h-5" />
                                <span>Ödeme Yöntemi</span>
                            </h2>
                            <div className="space-y-3">
                                {['card', 'transfer', 'cod'].map(method => (
                                    <div 
                                        key={method}
                                        onClick={() => setPaymentMethod(method as 'card' | 'transfer' | 'cod')}
                                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                            paymentMethod === method ? 'border-indigo-600 ring-2 ring-indigo-100 bg-indigo-50' : 'hover:border-gray-400'
                                        }`}
                                    >
                                        <p className="font-semibold capitalize">
                                            {method === 'card' ? 'Kredi/Banka Kartı' : method === 'transfer' ? 'Banka Havalesi' : 'Kapıda Ödeme'}
                                        </p>
                                        {paymentMethod === 'card' && (
                                            <div className="mt-2 p-2 border-t text-sm">
                                                Kart bilgileri formu yer tutucu
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sağ Sütun: Sipariş Özeti ve Buton */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-xl shadow-lg sticky top-4">
                            <h2 className="text-xl font-bold mb-4 border-b pb-2">Sipariş Özeti</h2>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between text-gray-700">
                                    <span>Ara Toplam</span>
                                    <span>{subtotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                                </div>
                                <div className="flex justify-between text-gray-700">
                                    <span>Kargo Ücreti ({shippingOption === 'standard' ? 'Standart' : 'Hızlı'})</span>
                                    <span>{shippingFee.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                                </div>
                                
                                <div className="flex justify-between text-lg font-bold pt-2 border-t mt-3">
                                    <span>Ödenecek Toplam Tutar</span>
                                    <span className="text-teal-700">{totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                                </div>
                            </div>
                            
                            <p className="text-xs text-red-500 mt-4">
                                {cartItems.some(item => item.product.stock_quantity < item.quantity) && "Bazı ürünlerin stok adedi sepetinizdeki miktardan az. Lütfen sepetinizi kontrol edin."}
                            </p>


                            <button 
                                onClick={handleSubmitOrder}
                                disabled={isSubmitting || !selectedShippingAddressId || cartItems.some(item => item.product.stock_quantity < item.quantity)}
                                className="w-full mt-6 py-3 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Sipariş Oluşturuluyor...</span>
                                    </>
                                ) : (
                                    <span>Siparişi Tamamla</span>
                                )}
                            </button>
                            
                            {!selectedAddress && (
                                <p className="text-sm text-red-500 mt-2 text-center">Lütfen teslimat adresi seçiniz.</p>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            <footer className="bg-gray-900 text-white py-8">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-gray-400">&copy; 2024 SineKapar. Tüm hakları saklıdır.</p>
                </div>
            </footer>
        </div>
    );
}