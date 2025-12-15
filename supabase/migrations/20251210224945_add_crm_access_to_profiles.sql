/*
  # Profillere CRM Erişim Kontrolü Ekleme
  
  1. Değişiklikler
    - `profiles` tablosuna `can_access_crm` boolean kolonu eklendi
    - Varsayılan değer: false (sadece yetkili kullanıcılar CRM'e erişebilir)
    - Admin bu değeri kontrol edebilir
  
  2. Güvenlik
    - Sadece adminler bu alanı güncelleyebilir
    - Policy eklendi
*/

-- Add can_access_crm column to profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'can_access_crm'
  ) THEN
    ALTER TABLE profiles ADD COLUMN can_access_crm boolean DEFAULT false;
  END IF;
END $$;

-- Add policy for admins to update profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admins can update all profiles'
  ) THEN
    CREATE POLICY "Admins can update all profiles"
      ON profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() IN (SELECT user_id FROM admin_emails WHERE user_id IS NOT NULL));
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN profiles.can_access_crm IS 'Determines if user can access CRM features (dealer dashboard, customers, operators, etc.)';
