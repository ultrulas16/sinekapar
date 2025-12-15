import { useEffect, useState, useCallback } from 'react'; // <-- useCallback eklendi
import { Plus, Edit, Trash2, Building2, MapPin } from 'lucide-react';
import { supabase, type Customer, type Dealer, type DealerTierLimit } from '../../lib/supabase';

interface DealerCustomersProps {
  dealerId: string;
  dealer: Dealer | null;
}

export default function DealerCustomers({ dealerId, dealer }: DealerCustomersProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tierLimit, setTierLimit] = useState<DealerTierLimit | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [form, setForm] = useState({
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    tax_number: '',
    notes: '',
  });

  // 1. loadCustomers fonksiyonu useCallback ile sarmalandı
  const loadCustomers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('dealer_id', dealerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  }, [dealerId]); // <-- dealerId'ye bağımlı

  // 2. loadTierLimit fonksiyonu useCallback ile sarmalandı
  const loadTierLimit = useCallback(async (tier: number) => {
    try {
      const { data, error } = await supabase
        .from('dealer_tier_limits')
        .select('*')
        .eq('tier', tier)
        .maybeSingle();

      if (error) throw error;
      if (data) setTierLimit(data);
    } catch (error) {
      console.error('Error loading tier limit:', error);
    }
  }, []); // Sadece ilk yüklemede çağrılacağı için boş bağımlılık dizisi

  // 3. useEffect bağımlılıkları güncellendi
  useEffect(() => {
    loadCustomers();
    if (dealer) loadTierLimit(dealer.tier);
  }, [loadCustomers, dealer, loadTierLimit]); // <-- loadCustomers ve loadTierLimit eklendi

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingCustomer && tierLimit && customers.length >= tierLimit.max_customers) {
      alert(`Bayi seviyeniz maksimum ${tierLimit.max_customers} müşteri eklemeye izin veriyor. Daha fazla müşteri eklemek için seviyenizi yükseltiniz.`);
      return;
    }

    try {
      const customerData = {
        ...form,
        dealer_id: dealerId,
        is_active: true,
      };

      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', editingCustomer.id);

        if (error) throw error;
      } else {
        // Yeni müşteri ekleniyor
        const { error } = await supabase.from('customers').insert(customerData);
        if (error) throw error;
      }

      // 4. Durum sıfırlanıp müşteriler yeniden yükleniyor (Zaten vardı, ama kararlı hale getirildi)
      setShowForm(false);
      setEditingCustomer(null);
      setForm({
        company_name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        tax_number: '',
        notes: '',
      });
      await loadCustomers(); // <-- Başarılı eklemeden/güncellemeden sonra veriyi yeniden çek
    } catch (error: any) {
      alert('Hata: ' + error.message);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({
      company_name: customer.company_name,
      contact_person: customer.contact_person || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      city: customer.city || '',
      tax_number: customer.tax_number || '',
      notes: customer.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (customerId: string) => {
    if (!confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase.from('customers').delete().eq('id', customerId);
      if (error) throw error;
      await loadCustomers(); // <-- Silme işleminden sonra listeyi tazele
    } catch (error: any) {
      alert('Hata: ' + error.message);
    }
  };

  const canAddMore = !tierLimit || customers.length < tierLimit.max_customers;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Müşteriler</h2>
          {tierLimit && (
            <p className="text-sm text-gray-600 mt-1">
              {customers.length} / {tierLimit.max_customers} müşteri kullanıldı
            </p>
          )}
        </div>
        <button
          onClick={() => {
            if (!canAddMore) {
              alert(`Maksimum müşteri limitine ulaştınız (${tierLimit?.max_customers}). Daha fazla müşteri eklemek için seviyenizi yükseltiniz.`);
              return;
            }
            setShowForm(!showForm);
            setEditingCustomer(null);
            setForm({
              company_name: '',
              contact_person: '',
              phone: '',
              email: '',
              address: '',
              city: '',
              tax_number: '',
              notes: '',
            });
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            canAddMore
              ? 'bg-teal-600 text-white hover:bg-teal-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Plus className="w-5 h-5" />
          <span>Yeni Müşteri</span>
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            {editingCustomer ? 'Müşteri Düzenle' : 'Yeni Müşteri Ekle'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Firma Adı *
                </label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yetkili Kişi
                </label>
                <input
                  type="text"
                  value={form.contact_person}
                  onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vergi No
                </label>
                <input
                  type="text"
                  value={form.tax_number}
                  onChange={(e) => setForm({ ...form, tax_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şehir
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adres
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notlar
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCustomer(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                {editingCustomer ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer) => (
          <div
            key={customer.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-teal-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{customer.company_name}</h3>
                  {customer.contact_person && (
                    <p className="text-sm text-gray-600 truncate">{customer.contact_person}</p>
                  )}
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleEdit(customer)}
                  className="text-teal-600 hover:text-teal-700 p-1"
                  title="Düzenle"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(customer.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              {customer.phone && <p>{customer.phone}</p>}
              {customer.email && <p className="truncate">{customer.email}</p>}
              {customer.city && (
                <p className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {customer.city}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {customers.length === 0 && !showForm && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz müşteri yok</h3>
          <p className="text-gray-600 mb-4">İlk müşterinizi ekleyerek başlayın</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Yeni Müşteri Ekle</span>
          </button>
        </div>
      )}
    </div>
  );
}