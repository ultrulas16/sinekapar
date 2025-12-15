# Admin Hesabı Kurulumu

Bu rehber ile sisteme ilk admin kullanıcısını ekleyebilirsiniz.

## Yöntem 1: Supabase Dashboard'dan (Önerilen)

### Adım 1: Kullanıcı Oluştur
1. Supabase Dashboard'a gidin (https://supabase.com/dashboard)
2. Projenizi seçin
3. Sol menüden **Authentication** > **Users** sekmesine gidin
4. Sağ üstteki **Add User** butonuna tıklayın
5. Email: `ulasserbetcioglu@gmail.com`
6. Password: `Sanane131734...`
7. **Auto Confirm User** seçeneğini işaretleyin (email onayı olmadan giriş için)
8. **Create User** butonuna tıklayın

### Adım 2: Admin Rolü Ata
1. Sol menüden **SQL Editor** sekmesine gidin
2. **New Query** butonuna tıklayın
3. Aşağıdaki SQL kodunu yapıştırın:

```sql
-- Admin profili oluştur
INSERT INTO profiles (id, role, full_name, phone)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'ulasserbetcioglu@gmail.com'),
  'admin',
  'Admin User',
  NULL
)
ON CONFLICT (id)
DO UPDATE SET role = 'admin';
```

4. **Run** butonuna basın
5. İşlem tamamlandı! Artık admin hesabı ile giriş yapabilirsiniz.

## Yöntem 2: Web Sitesinden Kayıt + SQL Güncelleme

### Adım 1: Web Sitesinde Kayıt Ol
1. Web sitenizin ana sayfasına gidin
2. **Kayıt Ol** butonuna tıklayın
3. Email: `ulasserbetcioglu@gmail.com`
4. Şifre: `Sanane131734...`
5. Ad Soyad: İstediğiniz bir isim
6. Kayıt olun

### Adım 2: Admin Rolü Ata
1. Supabase Dashboard > SQL Editor'a gidin
2. Şu komutu çalıştırın:

```sql
UPDATE profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'ulasserbetcioglu@gmail.com');
```

## Giriş Yapma

Admin hesabı hazır olduğunda:
1. Web sitesine gidin
2. **Giriş Yap** butonuna tıklayın
3. Email: `ulasserbetcioglu@gmail.com`
4. Şifre: `Sanane131734...`
5. Giriş yapın

Artık `/admin` sayfasına erişebilir ve tüm yönetim özelliklerini kullanabilirsiniz!

## Admin Paneli Özellikleri

- ✅ Ürün ekleme, düzenleme, silme
- ✅ Stok yönetimi
- ✅ Bayi başvurularını onaylama
- ✅ Bayi durumunu yönetme (aktif/askıda)
- ✅ Tüm bayileri görüntüleme
- ✅ Sipariş yönetimi

## Sorun mu yaşıyorsunuz?

Eğer yukarıdaki adımları takip ettikten sonra sorun yaşıyorsanız:

1. Supabase Dashboard > Authentication > Users bölümünden kullanıcının oluşturulduğunu kontrol edin
2. SQL Editor'dan şu sorguyu çalıştırarak profil durumunu kontrol edin:

```sql
SELECT p.*, u.email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'ulasserbetcioglu@gmail.com';
```

Sonuç `role = 'admin'` olmalıdır.
