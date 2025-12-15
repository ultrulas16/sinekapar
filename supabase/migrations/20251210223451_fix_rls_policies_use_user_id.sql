/*
  # Fix RLS Policies to Use user_id
  
  1. Problem
    - All RLS policies are querying auth.users table which causes permission errors
    - Policy: (SELECT users.email FROM auth.users WHERE users.id = auth.uid())
    
  2. Solution
    - Update all policies to use admin_emails.user_id instead of email lookup
    - Simple check: auth.uid() IN (SELECT user_id FROM admin_emails)
    
  3. Tables Updated
    - products (4 policies)
    - dealers (2 policies)
    - product_images (2 policies)
*/

-- Drop and recreate products policies
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;
DROP POLICY IF EXISTS "Admins can view all products" ON products;

CREATE POLICY "Admins can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM admin_emails WHERE user_id IS NOT NULL)
  );

CREATE POLICY "Admins can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM admin_emails WHERE user_id IS NOT NULL)
  );

CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM admin_emails WHERE user_id IS NOT NULL)
  );

CREATE POLICY "Admins can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM admin_emails WHERE user_id IS NOT NULL)
  );

-- Drop and recreate dealers policies
DROP POLICY IF EXISTS "Admins can view all dealers" ON dealers;
DROP POLICY IF EXISTS "Admins can update dealers" ON dealers;

CREATE POLICY "Admins can view all dealers"
  ON dealers FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM admin_emails WHERE user_id IS NOT NULL)
  );

CREATE POLICY "Admins can update dealers"
  ON dealers FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM admin_emails WHERE user_id IS NOT NULL)
  );

-- Drop and recreate product_images policies
DROP POLICY IF EXISTS "Admins can insert product images" ON product_images;
DROP POLICY IF EXISTS "Admins can delete product images" ON product_images;

CREATE POLICY "Admins can insert product images"
  ON product_images FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM admin_emails WHERE user_id IS NOT NULL)
  );

CREATE POLICY "Admins can delete product images"
  ON product_images FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM admin_emails WHERE user_id IS NOT NULL)
  );
