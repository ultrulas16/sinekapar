import { useEffect, useState } from 'react';
import { Package, Users, ShoppingBag, Plus, Edit, Trash2, CheckCircle, XCircle, Upload, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, type Product, type Dealer } from '../lib/supabase';
import Header from '../components/Header';

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
  is_main: boolean;
}

interface UserProfile {
  id: string;
  role: string;
  full_name: string;
  phone?: string;
  can_access_crm: boolean;
  created_at: string;
}

interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
}

interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: string;
  total_amount: number;
  shipping_address: string;
  shipping_city?: string;
  phone: string;
  created_at: string;
}

interface Return {
  id: string;
  order_id: string;
  user_id: string;
  return_number: string;
  status: string;
  reason: string;
  notes?: string;
  admin_notes?: string;
  refund_amount: number;
  created_at: string;
}

export default function AdminDashboard() {
  const { profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'dealers' | 'profiles' | 'cart' | 'orders' | 'returns'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<Record<string, ProductImage[]>>({});
  const [showImageForms, setShowImageForms] = useState<Record<string, boolean>>({});
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    specifications: '',
    base_price: '',
    dealer_tier1_price: '',
    dealer_tier2_price: '',
    dealer_tier3_price: '',
    stock_quantity: '',
    sku: '',
    category: '',
    vat_rate: '20',
    vat_included: 'false',
    shipping_option: 'standard',
  });

  useEffect(() => {
    if (loading) return;

    if (!profile || profile.role !== 'admin') {
      window.location.href = '/';
      return;
    }
    loadData();
  }, [profile, loading]);

  const loadData = async () => {
    try {
      const [productsRes, dealersRes, profilesRes, cartRes, ordersRes, returnsRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('dealers').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('cart').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('returns').select('*').order('created_at', { ascending: false }),
      ]);

      if (productsRes.data) {
        setProducts(productsRes.data);
        await loadProductImages(productsRes.data.map(p => p.id));
      }
      if (dealersRes.data) setDealers(dealersRes.data);
      if (profilesRes.data) setProfiles(profilesRes.data);
      if (cartRes.data) setCartItems(cartRes.data);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (returnsRes.data) setReturns(returnsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadProductImages = async (productIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .in('product_id', productIds)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const imagesByProduct: Record<string, ProductImage[]> = {};
      data?.forEach((img) => {
        if (!imagesByProduct[img.product_id]) {
          imagesByProduct[img.product_id] = [];
        }
        imagesByProduct[img.product_id].push(img);
      });

      setProductImages(imagesByProduct);
    } catch (error) {
      console.error('Error loading product images:', error);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const productData = {
        name: productForm.name,
        description: productForm.description,
        specifications: productForm.specifications,
        base_price: parseFloat(productForm.base_price),
        dealer_tier1_price: parseFloat(productForm.dealer_tier1_price),
        dealer_tier2_price: parseFloat(productForm.dealer_tier2_price),
        dealer_tier3_price: parseFloat(productForm.dealer_tier3_price),
        stock_quantity: parseInt(productForm.stock_quantity),
        sku: productForm.sku,
        category: productForm.category,
        vat_rate: parseInt(productForm.vat_rate),
        vat_included: productForm.vat_included === 'true',
        shipping_option: productForm.shipping_option,
        is_active: true,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(productData);
        if (error) throw error;
      }

      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        specifications: '',
        base_price: '',
        dealer_tier1_price: '',
        dealer_tier2_price: '',
        dealer_tier3_price: '',
        stock_quantity: '',
        sku: '',
        category: '',
        vat_rate: '20',
        vat_included: 'false',
        shipping_option: 'standard',
      });
      loadData();
    } catch (error: any) {
      alert('Hata: ' + error.message);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      specifications: product.specifications || '',
      base_price: product.base_price.toString(),
      dealer_tier1_price: product.dealer_tier1_price.toString(),
      dealer_tier2_price: product.dealer_tier2_price.toString(),
      dealer_tier3_price: product.dealer_tier3_price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      sku: product.sku || '',
      category: product.category || '',
      vat_rate: product.vat_rate.toString(),
      vat_included: product.vat_included.toString(),
      shipping_option: product.shipping_option || 'standard',
    });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      loadData();
    } catch (error: any) {
      alert('Hata: ' + error.message);
    }
  };

  const handleDealerStatusUpdate = async (dealerId: string, status: 'active' | 'suspended') => {
    try {
      const { error } = await supabase
        .from('dealers')
        .update({ status })
        .eq('id', dealerId);

      if (error) throw error;
      loadData();
    } catch (error: any) {
      alert('Hata: ' + error.message);
    }
  };

  const handleDealerTierUpdate = async (dealerId: string, tier: number) => {
    try {
      const { error } = await supabase
        .from('dealers')
        .update({ tier })
        .eq('id', dealerId);

      if (error) throw error;
      loadData();
    } catch (error: any) {
      alert('Hata: ' + error.message);
    }
  };

  const handleProfileRoleUpdate = async (profileId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', profileId);

      if (error) throw error;
      loadData();
    } catch (error: any) {
      alert('Hata: ' + error.message);
    }
  };

  const handleProfileCrmAccessUpdate = async (profileId: string, canAccessCrm: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ can_access_crm: canAccessCrm })
        .eq('id', profileId);

      if (error) throw error;
      loadData();
    } catch (error: any) {
      alert('Hata: ' + error.message);
    }
  };

  const handleImageUpload = async (productId: string, file: File) => {
    try {
      setUploadingImages({ ...uploadingImages, [productId]: true });

      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      const existingImages = productImages[productId] || [];
      const displayOrder = existingImages.length;

      const { error: dbError } = await supabase.from('product_images').insert({
        product_id: productId,
        image_url: publicUrl,
        display_order: displayOrder,
        is_main: existingImages.length === 0,
      });

      if (dbError) throw dbError;

      await loadProductImages([productId]);
      setShowImageForms({ ...showImageForms, [productId]: false });
    } catch (error: any) {
      alert('Hata: ' + error.message);
    } finally {
      setUploadingImages({ ...uploadingImages, [productId]: false });
    }
  };

  const handleAddProductImageUrl = async (productId: string, imageUrl: string) => {
    try {
      const existingImages = productImages[productId] || [];
      const displayOrder = existingImages.length;

      const { error } = await supabase.from('product_images').insert({
        product_id: productId,
        image_url: imageUrl,
        display_order: displayOrder,
        is_main: existingImages.length === 0,
      });

      if (error) throw error;
      await loadProductImages([productId]);
    } catch (error: any) {
      alert('Hata: ' + error.message);
    }
  };

  const handleDeleteProductImage = async (imageId: string, productId: string) => {
    if (!confirm('Bu görseli silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase.from('product_images').delete().eq('id', imageId);
      if (error) throw error;
      await loadProductImages([productId]);
    } catch (error: any) {
      alert('Hata: ' + error.message);
    }
  };

  const getTierLabel = (tier: number) => {
    switch (tier) {
      case 1: return 'Tier 1 (Premium)';
      case 2: return 'Tier 2 (Standart)';
      case 3: return 'Tier 3 (Temel)';
      default: return 'Tier 2 (Standart)';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!profile || profile.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Yönetim Paneli</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg p-6 text-white">
            <Package className="w-12 h-12 mb-4 opacity-80" />
            <p className="text-teal-100 mb-1">Toplam Ürün</p>
            <p className="text-4xl font-bold">{products.length}</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
            <Users className="w-12 h-12 mb-4 opacity-80" />
            <p className="text-cyan-100 mb-1">Toplam Bayi</p>
            <p className="text-4xl font-bold">{dealers.length}</p>
          </div>

          <div className="bg-gradient-to-br from-teal-600 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
            <ShoppingBag className="w-12 h-12 mb-4 opacity-80" />
            <p className="text-teal-100 mb-1">Toplam Sipariş</p>
            <p className="text-4xl font-bold">{orders.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600">Bekleyen Başvuru</p>
            <p className="text-2xl font-bold text-gray-900">
              {dealers.filter((d) => d.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600">Kayıtlı Kullanıcı</p>
            <p className="text-2xl font-bold text-gray-900">{profiles.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <p className="text-sm text-gray-600">Bekleyen İade</p>
            <p className="text-2xl font-bold text-gray-900">
              {returns.filter((r) => r.status === 'pending').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex space-x-4 px-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'products'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Ürünler
              </button>
              <button
                onClick={() => setActiveTab('dealers')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'dealers'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Bayiler
              </button>
              <button
                onClick={() => setActiveTab('profiles')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'profiles'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Profiller
              </button>
              <button
                onClick={() => setActiveTab('cart')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'cart'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Sepetler
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Siparişler
              </button>
              <button
                onClick={() => setActiveTab('returns')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'returns'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                İadeler
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'products' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Ürün Yönetimi</h2>
                  <button
                    onClick={() => {
                      setShowProductForm(!showProductForm);
                      setEditingProduct(null);
                      setProductForm({
                        name: '',
                        description: '',
                        specifications: '',
                        base_price: '',
                        dealer_tier1_price: '',
                        dealer_tier2_price: '',
                        dealer_tier3_price: '',
                        stock_quantity: '',
                        sku: '',
                        category: '',
                      });
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Yeni Ürün</span>
                  </button>
                </div>

                {showProductForm && (
                  <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">
                      {editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
                    </h3>
                    <form onSubmit={handleProductSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ürün Adı *
                          </label>
                          <input
                            type="text"
                            value={productForm.name}
                            onChange={(e) =>
                              setProductForm({ ...productForm, name: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            SKU
                          </label>
                          <input
                            type="text"
                            value={productForm.sku}
                            onChange={(e) =>
                              setProductForm({ ...productForm, sku: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Açıklama
                        </label>
                        <textarea
                          value={productForm.description}
                          onChange={(e) =>
                            setProductForm({ ...productForm, description: e.target.value })
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Satış Fiyatı *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={productForm.base_price}
                            onChange={(e) =>
                              setProductForm({ ...productForm, base_price: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bayi Tier 1 *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={productForm.dealer_tier1_price}
                            onChange={(e) =>
                              setProductForm({ ...productForm, dealer_tier1_price: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bayi Tier 2 *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={productForm.dealer_tier2_price}
                            onChange={(e) =>
                              setProductForm({ ...productForm, dealer_tier2_price: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bayi Tier 3 *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={productForm.dealer_tier3_price}
                            onChange={(e) =>
                              setProductForm({ ...productForm, dealer_tier3_price: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Stok Miktarı *
                          </label>
                          <input
                            type="number"
                            value={productForm.stock_quantity}
                            onChange={(e) =>
                              setProductForm({ ...productForm, stock_quantity: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kategori
                          </label>
                          <input
                            type="text"
                            value={productForm.category}
                            onChange={(e) =>
                              setProductForm({ ...productForm, category: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            KDV Oranı *
                          </label>
                          <select
                            value={productForm.vat_rate}
                            onChange={(e) =>
                              setProductForm({ ...productForm, vat_rate: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            required
                          >
                            <option value="1">%1</option>
                            <option value="10">%10</option>
                            <option value="20">%20</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            KDV Dahil/Hariç *
                          </label>
                          <select
                            value={productForm.vat_included}
                            onChange={(e) =>
                              setProductForm({ ...productForm, vat_included: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            required
                          >
                            <option value="false">+ KDV</option>
                            <option value="true">KDV Dahil</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nakliye Seçeneği *
                          </label>
                          <select
                            value={productForm.shipping_option}
                            onChange={(e) =>
                              setProductForm({ ...productForm, shipping_option: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            required
                          >
                            <option value="standard">Standart Kargo</option>
                            <option value="express">Hızlı Kargo</option>
                            <option value="pickup">Mağazadan Teslimat</option>
                            <option value="free">Ücretsiz Kargo</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowProductForm(false);
                            setEditingProduct(null);
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          İptal
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                        >
                          {editingProduct ? 'Güncelle' : 'Ekle'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="space-y-4">
                  {products.map((product) => {
                    const images = productImages[product.id] || [];
                    const showImageForm = showImageForms[product.id] || false;
                    const isUploading = uploadingImages[product.id] || false;

                    return (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{product.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              SKU: {product.sku || '-'} | Satış: {product.base_price.toLocaleString('tr-TR')} ₺
                            </p>
                            <p className="text-sm text-gray-600">
                              Tier 1: {product.dealer_tier1_price.toLocaleString('tr-TR')} ₺ |
                              Tier 2: {product.dealer_tier2_price.toLocaleString('tr-TR')} ₺ |
                              Tier 3: {product.dealer_tier3_price.toLocaleString('tr-TR')} ₺ |
                              Stok: {product.stock_quantity}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="text-teal-600 hover:text-teal-700"
                              title="Düzenle"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Sil"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-700">
                              Ürün Görselleri ({images.length})
                            </p>
                            <button
                              onClick={() => setShowImageForms({ ...showImageForms, [product.id]: !showImageForm })}
                              className="text-sm text-teal-600 hover:text-teal-700 flex items-center space-x-1"
                            >
                              <Upload className="w-4 h-4" />
                              <span>Görsel Ekle</span>
                            </button>
                          </div>

                          {showImageForm && (
                            <div className="mb-3 p-3 bg-gray-50 rounded-lg space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Dosya Yükle
                                </label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleImageUpload(product.id, file);
                                    }
                                  }}
                                  disabled={isUploading}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
                                />
                                {isUploading && (
                                  <p className="text-sm text-teal-600 mt-1">Yükleniyor...</p>
                                )}
                              </div>

                              <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                  <div className="w-full border-t border-gray-300" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                  <span className="px-2 bg-gray-50 text-gray-500">veya</span>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  URL ile Ekle
                                </label>
                                <div className="flex space-x-2">
                                  <input
                                    type="text"
                                    placeholder="Görsel URL'si (https://...)"
                                    id={`url-input-${product.id}`}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
                                  />
                                  <button
                                    onClick={() => {
                                      const input = document.getElementById(`url-input-${product.id}`) as HTMLInputElement;
                                      const url = input?.value;
                                      if (url) {
                                        handleAddProductImageUrl(product.id, url);
                                        input.value = '';
                                        setShowImageForms({ ...showImageForms, [product.id]: false });
                                      }
                                    }}
                                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
                                  >
                                    Ekle
                                  </button>
                                </div>
                              </div>

                              <button
                                onClick={() => setShowImageForms({ ...showImageForms, [product.id]: false })}
                                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 text-sm"
                              >
                                İptal
                              </button>
                            </div>
                          )}

                          {images.length > 0 ? (
                            <div className="grid grid-cols-4 gap-2">
                              {images.map((img) => (
                                <div key={img.id} className="relative group">
                                  <img
                                    src={img.image_url}
                                    alt={product.name}
                                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                  />
                                  {img.is_main && (
                                    <span className="absolute top-1 left-1 bg-teal-600 text-white text-xs px-2 py-0.5 rounded">
                                      Ana
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleDeleteProductImage(img.id, product.id)}
                                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">Henüz görsel eklenmemiş</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'dealers' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Bayi Yönetimi</h2>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Firma Adı
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          İletişim
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Şehir
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Seviye
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Durum
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {dealers.map((dealer) => (
                        <tr key={dealer.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {dealer.company_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div>{dealer.email}</div>
                            <div>{dealer.phone}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{dealer.city}</td>
                          <td className="px-4 py-3 text-sm">
                            <select
                              value={dealer.tier}
                              onChange={(e) => handleDealerTierUpdate(dealer.id, parseInt(e.target.value))}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500"
                            >
                              <option value={1}>Tier 1 (Premium)</option>
                              <option value={2}>Tier 2 (Standart)</option>
                              <option value={3}>Tier 3 (Temel)</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                dealer.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : dealer.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {dealer.status === 'active'
                                ? 'Aktif'
                                : dealer.status === 'pending'
                                ? 'Beklemede'
                                : 'Askıda'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right space-x-2">
                            {dealer.status === 'pending' && (
                              <button
                                onClick={() => handleDealerStatusUpdate(dealer.id, 'active')}
                                className="text-green-600 hover:text-green-700"
                                title="Onayla"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            )}
                            {dealer.status === 'active' && (
                              <button
                                onClick={() => handleDealerStatusUpdate(dealer.id, 'suspended')}
                                className="text-red-600 hover:text-red-700"
                                title="Askıya Al"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            )}
                            {dealer.status === 'suspended' && (
                              <button
                                onClick={() => handleDealerStatusUpdate(dealer.id, 'active')}
                                className="text-green-600 hover:text-green-700"
                                title="Aktif Et"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'profiles' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Kayıtlı Profiller</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ad Soyad</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rol</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Telefon</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">CRM Erişimi</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Kayıt Tarihi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {profiles.map((userProfile) => (
                        <tr key={userProfile.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{userProfile.full_name}</td>
                          <td className="px-4 py-3 text-sm">
                            <select
                              value={userProfile.role}
                              onChange={(e) => handleProfileRoleUpdate(userProfile.id, e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-teal-500"
                            >
                              <option value="end_user">Son Kullanıcı</option>
                              <option value="dealer">Bayi</option>
                              <option value="operator">Operatör</option>
                              <option value="customer">Müşteri</option>
                              <option value="customer_branch">Şube</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{userProfile.phone || '-'}</td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => handleProfileCrmAccessUpdate(userProfile.id, !userProfile.can_access_crm)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                userProfile.can_access_crm ? 'bg-teal-600' : 'bg-gray-300'
                              }`}
                              title={userProfile.can_access_crm ? 'CRM Erişimi Aktif' : 'CRM Erişimi Kapalı'}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  userProfile.can_access_crm ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(userProfile.created_at).toLocaleDateString('tr-TR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'cart' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Kullanıcı Sepetleri</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Kullanıcı ID</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ürün ID</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Miktar</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Eklenme Tarihi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {cartItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-mono text-xs">{item.user_id.slice(0, 8)}...</td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-mono text-xs">{item.product_id.slice(0, 8)}...</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(item.created_at).toLocaleDateString('tr-TR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {cartItems.length === 0 && (
                    <div className="text-center py-8 text-gray-500">Sepette ürün yok</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Siparişler</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Sipariş No</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Kullanıcı</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tutar</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Adres</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Durum</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tarih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.order_number}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">{order.user_id.slice(0, 8)}...</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            {order.total_amount.toLocaleString('tr-TR')} ₺
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div>{order.shipping_city}</div>
                            <div className="text-xs">{order.shipping_address.slice(0, 30)}...</div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status === 'pending' ? 'Bekliyor' :
                               order.status === 'processing' ? 'İşleniyor' :
                               order.status === 'shipped' ? 'Kargoda' :
                               order.status === 'delivered' ? 'Teslim Edildi' :
                               order.status === 'cancelled' ? 'İptal' : order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString('tr-TR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {orders.length === 0 && (
                    <div className="text-center py-8 text-gray-500">Sipariş yok</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'returns' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">İade Talepleri</h2>
                <div className="space-y-4">
                  {returns.map((returnItem) => (
                    <div key={returnItem.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">İade No: {returnItem.return_number}</h3>
                          <p className="text-sm text-gray-600">Sipariş ID: {returnItem.order_id.slice(0, 8)}...</p>
                          <p className="text-sm text-gray-600">Kullanıcı ID: {returnItem.user_id.slice(0, 8)}...</p>
                        </div>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          returnItem.status === 'completed' ? 'bg-green-100 text-green-800' :
                          returnItem.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                          returnItem.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {returnItem.status === 'pending' ? 'Bekliyor' :
                           returnItem.status === 'approved' ? 'Onaylandı' :
                           returnItem.status === 'rejected' ? 'Reddedildi' :
                           returnItem.status === 'completed' ? 'Tamamlandı' : returnItem.status}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-gray-700">İade Nedeni:</p>
                          <p className="text-sm text-gray-600">{returnItem.reason}</p>
                        </div>
                        {returnItem.notes && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Müşteri Notu:</p>
                            <p className="text-sm text-gray-600">{returnItem.notes}</p>
                          </div>
                        )}
                        {returnItem.admin_notes && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Admin Notu:</p>
                            <p className="text-sm text-gray-600">{returnItem.admin_notes}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          <p className="text-sm font-semibold text-gray-900">
                            İade Tutarı: {returnItem.refund_amount.toLocaleString('tr-TR')} ₺
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(returnItem.created_at).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {returns.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-500">İade talebi yok</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
