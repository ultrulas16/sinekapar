import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Users, Phone, Mail } from 'lucide-react';
import { supabase, type Operator, type Dealer, type DealerTierLimit } from '../../lib/supabase';

interface DealerOperatorsProps {
  dealerId: string;
  dealer: Dealer | null;
}

export default function DealerOperators({ dealerId, dealer }: DealerOperatorsProps) {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [tierLimit, setTierLimit] = useState<DealerTierLimit | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    loadOperators();
    if (dealer) loadTierLimit(dealer.tier);
  }, [dealerId, dealer]);

  const loadOperators = async () => {
    try {
      const { data, error } = await supabase
        .from('operators')
        .select('*')
        .eq('dealer_id', dealerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setOperators(data);
    } catch (error) {
      console.error('Error loading operators:', error);
    }
  };

  const loadTierLimit = async (tier: number) => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingOperator && tierLimit && operators.length >= tierLimit.max_operators) {
      alert(`Bayi seviyeniz maksimum ${tierLimit.max_operators} operatör eklemeye izin veriyor. Daha fazla operatör eklemek için seviyenizi yükseltiniz.`);
      return;
    }

    try {
      const operatorData = {
        ...form,
        dealer_id: dealerId,
        is_active: true,
      };

      if (editingOperator) {
        const { error } = await supabase
          .from('operators')
          .update(operatorData)
          .eq('id', editingOperator.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('operators').insert(operatorData);
        if (error) throw error;
      }

      setShowForm(false);
      setEditingOperator(null);
      setForm({
        full_name: '',
        phone: '',
        email: '',
      });
      loadOperators();
    } catch (error: any) {
      alert('Hata: ' + error.message);
    }
  };

  const handleEdit = (operator: Operator) => {
    setEditingOperator(operator);
    setForm({
      full_name: operator.full_name,
      phone: operator.phone || '',
      email: operator.email || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (operatorId: string) => {
    if (!confirm('Bu operatörü silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase.from('operators').delete().eq('id', operatorId);
      if (error) throw error;
      loadOperators();
    } catch (error: any) {
      alert('Hata: ' + error.message);
    }
  };

  const handleToggleActive = async (operator: Operator) => {
    try {
      const { error } = await supabase
        .from('operators')
        .update({ is_active: !operator.is_active })
        .eq('id', operator.id);

      if (error) throw error;
      loadOperators();
    } catch (error: any) {
      alert('Hata: ' + error.message);
    }
  };

  const canAddMore = !tierLimit || operators.length < tierLimit.max_operators;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Operatörler</h2>
          {tierLimit && (
            <p className="text-sm text-gray-600 mt-1">
              {operators.length} / {tierLimit.max_operators} operatör kullanıldı
            </p>
          )}
        </div>
        <button
          onClick={() => {
            if (!canAddMore) {
              alert(`Maksimum operatör limitine ulaştınız (${tierLimit?.max_operators}). Daha fazla operatör eklemek için bayi seviyenizi yükseltiniz.`);
              return;
            }
            setShowForm(!showForm);
            setEditingOperator(null);
            setForm({
              full_name: '',
              phone: '',
              email: '',
            });
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            canAddMore
              ? 'bg-teal-600 text-white hover:bg-teal-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Plus className="w-5 h-5" />
          <span>Yeni Operatör</span>
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            {editingOperator ? 'Operatör Düzenle' : 'Yeni Operatör Ekle'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ad Soyad *
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
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
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingOperator(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                {editingOperator ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {operators.map((operator) => (
          <div
            key={operator.id}
            className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
              operator.is_active ? 'border-gray-200' : 'border-gray-300 bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    operator.is_active ? 'bg-cyan-100' : 'bg-gray-200'
                  }`}
                >
                  <Users className={`w-6 h-6 ${operator.is_active ? 'text-cyan-600' : 'text-gray-500'}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{operator.full_name}</h3>
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
              <div className="flex space-x-1">
                <button
                  onClick={() => handleEdit(operator)}
                  className="text-teal-600 hover:text-teal-700 p-1"
                  title="Düzenle"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(operator.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              {operator.phone && (
                <p className="flex items-center">
                  <Phone className="w-3 h-3 mr-2" />
                  {operator.phone}
                </p>
              )}
              {operator.email && (
                <p className="flex items-center truncate">
                  <Mail className="w-3 h-3 mr-2 flex-shrink-0" />
                  <span className="truncate">{operator.email}</span>
                </p>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => handleToggleActive(operator)}
                className={`text-sm font-medium ${
                  operator.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
                }`}
              >
                {operator.is_active ? 'Pasif Yap' : 'Aktif Yap'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {operators.length === 0 && !showForm && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz operatör yok</h3>
          <p className="text-gray-600 mb-4">İlk operatörünüzü ekleyerek başlayın</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Yeni Operatör Ekle</span>
          </button>
        </div>
      )}
    </div>
  );
}
