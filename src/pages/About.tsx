import Header from '../components/Header';
import { Shield, Award, Users, Target } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-6 text-center">Hakkımızda</h1>

            <div className="prose prose-lg max-w-none mb-12">
              <p className="text-lg text-gray-600 mb-6">
                SineKapar, profesyonel sinek kontrol cihazları üretimi ve satışında Türkiye'nin öncü firmalarından biridir.
                İlaçlama firmalarına özel bayilik sistemi ile hizmet vermekteyiz.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                Ürünlerimiz, sağlık bakanlığı onaylı ve CE sertifikalıdır. Müşteri memnuniyeti ve kalite odaklı
                çalışma prensibimizle sektörde fark yaratıyoruz.
              </p>
              <p className="text-lg text-gray-600">
                2010 yılından bu yana faaliyet gösteren firmamız, binlerce ilaçlama firmasına hizmet vermekte ve
                on binlerce son kullanıcıya ulaşmaktadır. Yenilikçi teknolojileri ve çevre dostu ürünlerimizle
                sektörün lideri olmayı hedefliyoruz.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6">
                <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Güvenilirlik</h3>
                <p className="text-gray-600">
                  Tüm ürünlerimiz sağlık bakanlığı onaylı ve uluslararası standartlara uygun olarak üretilmektedir.
                </p>
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl p-6">
                <div className="w-12 h-12 bg-cyan-600 rounded-lg flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Kalite</h3>
                <p className="text-gray-600">
                  CE sertifikalı ürünlerimiz, en yüksek kalite standartlarında üretilir ve test edilir.
                </p>
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6">
                <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Müşteri Odaklı</h3>
                <p className="text-gray-600">
                  7/24 müşteri desteği ve hızlı çözüm odaklı yaklaşımımızla yanınızdayız.
                </p>
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl p-6">
                <div className="w-12 h-12 bg-cyan-600 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Yenilikçilik</h3>
                <p className="text-gray-600">
                  Sürekli Ar-Ge çalışmalarımızla sektörün en yenilikçi çözümlerini sunuyoruz.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl p-8 text-white text-center">
              <h3 className="text-2xl font-bold mb-4">Bayilik Fırsatları</h3>
              <p className="mb-6">
                İlaçlama firması olarak bayimiz olmak ister misiniz? Özel fiyatlandırma ve destek paketlerimiz için
                hemen başvurun!
              </p>
              <a
                href="/dealer-register"
                className="inline-block px-8 py-3 bg-white text-teal-600 rounded-lg font-semibold hover:bg-teal-50 transition-colors"
              >
                Bayi Başvurusu Yap
              </a>
            </div>
          </div>
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
