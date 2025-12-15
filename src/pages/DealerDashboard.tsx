import { useEffect, useState } from 'react';
import { Users, Calendar, DollarSign, Package, Plus, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';

interface Customer {
  id: string;
  company_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  city?: string;
  is_active: boolean;
}

interface CustomerBranch {
  id: string;
  customer_id: string;
  branch_name: string;
  address: string;
  city?: string;
  contact_person?: string;
  phone?: string;
}

interface Operator {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  is_active: boolean;
}

interface Visit {
  id: string;
  customer_id: string;
  customer_branch_id?: string;
  operator_id?: string;
  visit_date: string;
  status: string;
  service_type?: string;
  notes?: string;
}

interface Sale {
  id: string;
  customer_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_status: string;
  sale_date: string;
  visit_id?: string;
}

export default function DealerDashboard() {
  const { profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'customers' | 'branches' | 'visits' | 'sales' | 'operators' | 'products'>('customers');
  const [dealerId, setDealerId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<CustomerBranch[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [showOperatorForm, setShowOperatorForm] = useState(false);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);

  const [customerForm, setCustomerForm] = useState({
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    city: '',
  });

  const [operatorForm, setOperatorForm] = useState({
    full_name: '',
    phone: '',
    email: '',
  });

  const [visitForm, setVisitForm] = useState({
    customer_id: '',
    customer_branch_id: '',
    operator_id: '',
    visit_date: '',
    service_type: '',
    notes: '',
  });

  const [branchForm, setBranchForm] = useState({
    customer_id: '',
    branch_name: '',
    address: '',
    city: '',
    contact_person: '',
    phone: '',
  });

  const [saleForm, setSaleForm] = useState({
    customer_id: '',
    visit_id: '',
    product_name: '',
    quantity: '',
    unit_price: '',
    payment_status: 'pending',
  });

  useEffect(() => {
    if (loading) return;

    if (!profile || profile.role !== 'dealer') {
      window.location.href = '/';
      return;
    }
    if (!profile.can_access_crm) {
      alert('CRM erişim yetkiniz bulunmamaktadır. Lütfen yöneticinizle iletişime geçin.');
      window.location.href = '/';
      return;
    }
    loadDealerData();
  }, [profile, loading]);

  const loadDealerData = async () => {
    if (!profile) return;

    try {
      const { data: dealerData, error: dealerError } = await supabase
        .from('dealers')
        .select('id')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (dealerError) throw dealerError;
      if (!dealerData) {
        alert('Bayi kaydınız bulunamadı');
        return;
      }

      setDealerId(dealerData.id);
      loadData(dealerData.id);
    } catch (error) {
      console.error('Error loading dealer:', error);
    }
  };

  const loadData = async (dId: string) => {
    try {
      const customersRes = await supabase.from('customers').select('*').eq('dealer_id', dId).order('created_at', { ascending: false });

      let branchesData: CustomerBranch[] = [];
      if (customersRes.data && customersRes.data.length > 0) {
        const customerIds = customersRes.data.map(c => c.id);
        const branchesRes = await supabase
          .from('customer_branches')
          .select('*')
          .in('customer_id', customerIds)
          .order('created_at', { ascending: false });

        if (branchesRes.data) branchesData = branchesRes.data;
      }

      const [visitsRes, salesRes, operatorsRes] = await Promise.all([
        supabase.from('visits').select('*').eq('dealer_id', dId).order('visit_date', { ascending: false }),
        supabase.from('sales').select('*').eq('dealer_id', dId).order('sale_date', { ascending: false }),
        supabase.from('operators').select('*').eq('dealer_id', dId).order('created_at', { ascending: false }),
      ]);

      if (customersRes.data) setCustomers(customersRes.data);
      setBranches(branchesData);
      if (visitsRes.data) setVisits(visitsRes.data);
      if (salesRes.data) setSales(salesRes.data);
      if (operatorsRes.data) setOperators(operatorsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerId) return;

    try {
      const { error } = await supabase.from('customers').insert({
        dealer_id: dealerId,
        ...customerForm,
      });

      if (error) throw error;

      setShowCustomerForm(false);
      setCustomerForm({
        company_name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        city: '',
      });
      loadData(dealerId);
    } catch (error: any) {
      alert('Hata: ' + error.message);
    }
  };

  const handleOperatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerId) return;

    try {
      const { error } = await supabase.from('operators').insert({
        dealer_id: dealerId,
        ...operatorForm,
      });

      if (error) throw error;

      setShowOperatorForm(false);
      setOperatorForm({
        full_name: '',
        phone: '',
        email: '',
      });
      loadData(dealerId);
    } catch (error: any) {
      alert('Hata: ' + error.message);
    }
  };

  const handleVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerId) return;

    try {
      const { error } = await supabase.from('visits').insert({
        dealer_id: dealerId,
        customer_id: visitForm.customer_id,
        customer_branch_id: visitForm.customer_branch_id || null,
        operator_id: visitForm.operator_id || null,
        visit_date: new Date(visitForm.visit_date).toISOString(),
        service_type: visitForm.service_type,
        notes: visitForm.notes,
        status: 'scheduled',
      });

      if (error) throw error;

      setShowVisitForm(false);
      setVisitForm({
        customer_id: '',
        customer_branch_id: '',
        operator_id: '',
        visit_date: '',
        service_type: '',
        notes: '',
      });
      loadData(dealerId);
    } catch (error: any) {
      alert('Hata: ' + error.message);
    }
  };

  const handleBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerId) return;

    try {
      const { error } = await supabase.from('customer_branches').insert({
        customer_id: branchForm.customer_id,
        branch_name: branchForm.branch_name,
        address: branchForm.address,
        city: branchForm.city,
        contact_person: branchForm.contact_person,
        phone: branchForm.phone,
      });

      if (error) throw error;

      setShowBranchForm(false);
      setBranchForm({
        customer_id: '',
        branch_name: '',
        address: '',
        city: '',
        contact_person: '',
        phone: '',
      });
      loadData(dealerId);
    } catch (error: any) {
      alert('Hata: ' + error.message);
    }
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerId) return;

    try {
      const quantity = parseInt(saleForm.quantity);
      const unitPrice = parseFloat(saleForm.unit_price);
      const totalAmount = quantity * unitPrice;

      const { error } = await supabase.from('sales').insert({
        dealer_id: dealerId,
        customer_id: saleForm.customer_id,
        visit_id: saleForm.visit_id || null,
        product_name: saleForm.product_name,
        quantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        payment_status: saleForm.payment_status,
      });

      if (error) throw error;

      setShowSaleForm(false);
      setSaleForm({
        customer_id: '',
        visit_id: '',
        product_name: '',
        quantity: '',
        unit_price: '',
        payment_status: 'pending',
      });
      loadData(dealerId);
    } catch (error: any) {
      alert('Hata: ' + error.message);
    }
  };

  if (profile?.role !== 'dealer') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Bayi Paneli</h1>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg p-4 text-white">
            <Users className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-teal-100 mb-1 text-sm">Müşteriler</p>
            <p className="text-2xl font-bold">{customers.length}</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg p-4 text-white">
            <Building2 className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-cyan-100 mb-1 text-sm">Şubeler</p>
            <p className="text-2xl font-bold">{branches.length}</p>
          </div>

          <div className="bg-gradient-to-br from-teal-600 to-cyan-600 rounded-xl shadow-lg p-4 text-white">
            <Calendar className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-teal-100 mb-1 text-sm">Ziyaretler</p>
            <p className="text-2xl font-bold">{visits.length}</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-600 to-teal-700 rounded-xl shadow-lg p-4 text-white">
            <DollarSign className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-cyan-100 mb-1 text-sm">Satışlar</p>
            <p className="text-2xl font-bold">{sales.length}</p>
          </div>

          <div className="bg-gradient-to-br from-teal-700 to-cyan-700 rounded-xl shadow-lg p-4 text-white">
            <Users className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-teal-100 mb-1 text-sm">Operatörler</p>
            <p className="text-2xl font-bold">{operators.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('customers')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'customers'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Müşteriler
              </button>
              <button
                onClick={() => setActiveTab('branches')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'branches'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Şubeler
              </button>
              <button
                onClick={() => setActiveTab('visits')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'visits'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Ziyaretler
              </button>
              <button
                onClick={() => setActiveTab('sales')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'sales'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Satışlar
              </button>
              <button
                onClick={() => setActiveTab('operators')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'operators'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Operatörler
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'products'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Ürün Siparişi
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'customers' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Müşteriler</h2>
                  <button
                    onClick={() => setShowCustomerForm(!showCustomerForm)}
                    className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Yeni Müşteri</span>
                  </button>
                </div>

                {showCustomerForm && (
                  <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Yeni Müşteri Ekle</h3>
                    <form onSubmit={handleCustomerSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Firma Adı *
                          </label>
                          <input
                            type="text"
                            value={customerForm.company_name}
                            onChange={(e) =>
                              setCustomerForm({ ...customerForm, company_name: e.target.value })
                            }
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
                            value={customerForm.contact_person}
                            onChange={(e) =>
                              setCustomerForm({ ...customerForm, contact_person: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Telefon
                          </label>
                          <input
                            type="tel"
                            value={customerForm.phone}
                            onChange={(e) =>
                              setCustomerForm({ ...customerForm, phone: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            E-posta
                          </label>
                          <input
                            type="email"
                            value={customerForm.email}
                            onChange={(e) =>
                              setCustomerForm({ ...customerForm, email: e.target.value })
                            }
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
                            value={customerForm.city}
                            onChange={(e) =>
                              setCustomerForm({ ...customerForm, city: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Adres
                          </label>
                          <input
                            type="text"
                            value={customerForm.address}
                            onChange={(e) =>
                              setCustomerForm({ ...customerForm, address: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowCustomerForm(false)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          İptal
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                        >
                          Ekle
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
                          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-teal-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{customer.company_name}</h3>
                            {customer.contact_person && (
                              <p className="text-sm text-gray-600">{customer.contact_person}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        {customer.phone && <p>{customer.phone}</p>}
                        {customer.email && <p>{customer.email}</p>}
                        {customer.city && <p>{customer.city}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'branches' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Müşteri Şubeleri</h2>
                  <button
                    onClick={() => setShowBranchForm(!showBranchForm)}
                    className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Yeni Şube</span>
                  </button>
                </div>

                {showBranchForm && (
                  <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Yeni Şube Ekle</h3>
                    <form onSubmit={handleBranchSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Müşteri *
                          </label>
                          <select
                            value={branchForm.customer_id}
                            onChange={(e) =>
                              setBranchForm({ ...branchForm, customer_id: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            required
                          >
                            <option value="">Seçiniz</option>
                            {customers.map((customer) => (
                              <option key={customer.id} value={customer.id}>
                                {customer.company_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Şube Adı *
                          </label>
                          <input
                            type="text"
                            value={branchForm.branch_name}
                            onChange={(e) =>
                              setBranchForm({ ...branchForm, branch_name: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Adres *
                          </label>
                          <input
                            type="text"
                            value={branchForm.address}
                            onChange={(e) =>
                              setBranchForm({ ...branchForm, address: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Şehir
                          </label>
                          <input
                            type="text"
                            value={branchForm.city}
                            onChange={(e) =>
                              setBranchForm({ ...branchForm, city: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Yetkili Kişi
                          </label>
                          <input
                            type="text"
                            value={branchForm.contact_person}
                            onChange={(e) =>
                              setBranchForm({ ...branchForm, contact_person: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Telefon
                          </label>
                          <input
                            type="tel"
                            value={branchForm.phone}
                            onChange={(e) =>
                              setBranchForm({ ...branchForm, phone: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowBranchForm(false)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          İptal
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                        >
                          Ekle
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {branches.map((branch) => {
                    const customer = customers.find((c) => c.id === branch.customer_id);
                    return (
                      <div
                        key={branch.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-cyan-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{branch.branch_name}</h3>
                              <p className="text-sm text-gray-600">{customer?.company_name || '-'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>{branch.address}</p>
                          {branch.city && <p>{branch.city}</p>}
                          {branch.contact_person && <p>Yetkili: {branch.contact_person}</p>}
                          {branch.phone && <p>{branch.phone}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'visits' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Ziyaretler</h2>
                  <button
                    onClick={() => setShowVisitForm(!showVisitForm)}
                    className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Yeni Ziyaret</span>
                  </button>
                </div>

                {showVisitForm && (
                  <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Yeni Ziyaret Planla</h3>
                    <form onSubmit={handleVisitSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Müşteri *
                          </label>
                          <select
                            value={visitForm.customer_id}
                            onChange={(e) =>
                              setVisitForm({ ...visitForm, customer_id: e.target.value, customer_branch_id: '' })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            required
                          >
                            <option value="">Seçiniz</option>
                            {customers.map((customer) => (
                              <option key={customer.id} value={customer.id}>
                                {customer.company_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Müşteri Şubesi
                          </label>
                          <select
                            value={visitForm.customer_branch_id}
                            onChange={(e) =>
                              setVisitForm({ ...visitForm, customer_branch_id: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            disabled={!visitForm.customer_id}
                          >
                            <option value="">Merkez/Seçiniz</option>
                            {branches
                              .filter(b => b.customer_id === visitForm.customer_id)
                              .map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                  {branch.branch_name}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Operatör
                          </label>
                          <select
                            value={visitForm.operator_id}
                            onChange={(e) =>
                              setVisitForm({ ...visitForm, operator_id: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="">Seçiniz</option>
                            {operators.map((operator) => (
                              <option key={operator.id} value={operator.id}>
                                {operator.full_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tarih ve Saat *
                          </label>
                          <input
                            type="datetime-local"
                            value={visitForm.visit_date}
                            onChange={(e) =>
                              setVisitForm({ ...visitForm, visit_date: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hizmet Tipi
                          </label>
                          <input
                            type="text"
                            value={visitForm.service_type}
                            onChange={(e) =>
                              setVisitForm({ ...visitForm, service_type: e.target.value })
                            }
                            placeholder="Örn: Rutin kontrol"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notlar
                        </label>
                        <textarea
                          value={visitForm.notes}
                          onChange={(e) =>
                            setVisitForm({ ...visitForm, notes: e.target.value })
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowVisitForm(false)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          İptal
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                        >
                          Ekle
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="space-y-3">
                  {visits.map((visit) => {
                    const customer = customers.find((c) => c.id === visit.customer_id);
                    const operator = operators.find((o) => o.id === visit.operator_id);

                    return (
                      <div
                        key={visit.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {customer?.company_name || 'Müşteri bulunamadı'}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(visit.visit_date).toLocaleString('tr-TR')}
                            </p>
                            {operator && (
                              <p className="text-sm text-gray-600">Operatör: {operator.full_name}</p>
                            )}
                            {visit.service_type && (
                              <p className="text-sm text-gray-600">Hizmet: {visit.service_type}</p>
                            )}
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              visit.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : visit.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {visit.status === 'completed'
                              ? 'Tamamlandı'
                              : visit.status === 'in_progress'
                              ? 'Devam Ediyor'
                              : 'Planlandı'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'sales' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Malzeme Satışları</h2>
                  <button
                    onClick={() => setShowSaleForm(!showSaleForm)}
                    className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Yeni Satış</span>
                  </button>
                </div>

                {showSaleForm && (
                  <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Yeni Satış Ekle</h3>
                    <form onSubmit={handleSaleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Müşteri *
                          </label>
                          <select
                            value={saleForm.customer_id}
                            onChange={(e) =>
                              setSaleForm({ ...saleForm, customer_id: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            required
                          >
                            <option value="">Seçiniz</option>
                            {customers.map((customer) => (
                              <option key={customer.id} value={customer.id}>
                                {customer.company_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ziyaret (Opsiyonel)
                          </label>
                          <select
                            value={saleForm.visit_id}
                            onChange={(e) =>
                              setSaleForm({ ...saleForm, visit_id: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="">Seçiniz</option>
                            {visits.filter(v => v.customer_id === saleForm.customer_id).map((visit) => {
                              const customer = customers.find(c => c.id === visit.customer_id);
                              return (
                                <option key={visit.id} value={visit.id}>
                                  {customer?.company_name} - {new Date(visit.visit_date).toLocaleDateString('tr-TR')}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ürün/Malzeme Adı *
                          </label>
                          <input
                            type="text"
                            value={saleForm.product_name}
                            onChange={(e) =>
                              setSaleForm({ ...saleForm, product_name: e.target.value })
                            }
                            placeholder="Örn: Sinek Yakalama Cihazı"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Miktar *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={saleForm.quantity}
                            onChange={(e) =>
                              setSaleForm({ ...saleForm, quantity: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Birim Fiyat *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={saleForm.unit_price}
                            onChange={(e) =>
                              setSaleForm({ ...saleForm, unit_price: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ödeme Durumu
                        </label>
                        <select
                          value={saleForm.payment_status}
                          onChange={(e) =>
                            setSaleForm({ ...saleForm, payment_status: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="pending">Bekliyor</option>
                          <option value="paid">Ödendi</option>
                          <option value="partial">Kısmi Ödendi</option>
                        </select>
                      </div>

                      {saleForm.quantity && saleForm.unit_price && (
                        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                          <p className="text-sm font-medium text-teal-900">
                            Toplam Tutar: {(parseFloat(saleForm.quantity) * parseFloat(saleForm.unit_price)).toLocaleString('tr-TR')} ₺
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowSaleForm(false)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          İptal
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                        >
                          Ekle
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Tarih
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Müşteri
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Ürün/Malzeme
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                          Miktar
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                          Birim Fiyat
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                          Toplam
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                          Ödeme
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sales.map((sale) => {
                        const customer = customers.find((c) => c.id === sale.customer_id);
                        return (
                          <tr key={sale.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {new Date(sale.sale_date).toLocaleDateString('tr-TR')}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {customer?.company_name || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {sale.product_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              {sale.quantity}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              {sale.unit_price.toLocaleString('tr-TR')} ₺
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                              {sale.total_amount.toLocaleString('tr-TR')} ₺
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <span
                                className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  sale.payment_status === 'paid'
                                    ? 'bg-green-100 text-green-800'
                                    : sale.payment_status === 'partial'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {sale.payment_status === 'paid'
                                  ? 'Ödendi'
                                  : sale.payment_status === 'partial'
                                  ? 'Kısmi'
                                  : 'Bekliyor'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'operators' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Operatörler</h2>
                  <button
                    onClick={() => setShowOperatorForm(!showOperatorForm)}
                    className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Yeni Operatör</span>
                  </button>
                </div>

                {showOperatorForm && (
                  <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Yeni Operatör Ekle</h3>
                    <form onSubmit={handleOperatorSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ad Soyad *
                          </label>
                          <input
                            type="text"
                            value={operatorForm.full_name}
                            onChange={(e) =>
                              setOperatorForm({ ...operatorForm, full_name: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Telefon
                          </label>
                          <input
                            type="tel"
                            value={operatorForm.phone}
                            onChange={(e) =>
                              setOperatorForm({ ...operatorForm, phone: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            E-posta
                          </label>
                          <input
                            type="email"
                            value={operatorForm.email}
                            onChange={(e) =>
                              setOperatorForm({ ...operatorForm, email: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowOperatorForm(false)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          İptal
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                        >
                          Ekle
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {operators.map((operator) => (
                    <div
                      key={operator.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-cyan-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{operator.full_name}</h3>
                            <span
                              className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                                operator.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {operator.is_active ? 'Aktif' : 'Pasif'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        {operator.phone && <p>{operator.phone}</p>}
                        {operator.email && <p>{operator.email}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ürün Sipariş Sistemi</h3>
                <p className="text-gray-600">
                  Yakında bayi fiyatları ile ürün siparişi verebileceksiniz.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
