/*
  # Fix RLS Policies Infinite Recursion

  ## Changes
  1. Remove recursive admin check from profiles policies
  2. Create admin_emails table for simpler admin verification
  3. Update all policies to use admin_emails instead of recursive profile check
  4. Add ulasserbetcioglu@gmail.com as admin

  ## Security
  - Maintains strict RLS
  - Removes recursion issue
  - Uses email-based admin check
*/

-- Create admin emails table
CREATE TABLE IF NOT EXISTS admin_emails (
  email text PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_emails ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin emails
CREATE POLICY "Only admins can view admin emails"
  ON admin_emails FOR SELECT
  TO authenticated
  USING (
    email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    ) AND email IN (SELECT email FROM admin_emails)
  );

-- Insert initial admin
INSERT INTO admin_emails (email) VALUES ('ulasserbetcioglu@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Drop old recursive policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update dealers" ON dealers;
DROP POLICY IF EXISTS "Admins can view all dealers" ON dealers;
DROP POLICY IF EXISTS "Admins can view all products" ON products;
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;
DROP POLICY IF EXISTS "Admins can view all pricing" ON product_pricing;
DROP POLICY IF EXISTS "Admins can insert pricing" ON product_pricing;
DROP POLICY IF EXISTS "Admins can update pricing" ON product_pricing;
DROP POLICY IF EXISTS "Admins can insert product images" ON product_images;
DROP POLICY IF EXISTS "Admins can delete product images" ON product_images;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;

-- Recreate policies without recursion
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM admin_emails)
  );

CREATE POLICY "Admins can view all dealers"
  ON dealers FOR SELECT
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM admin_emails)
  );

CREATE POLICY "Admins can update dealers"
  ON dealers FOR UPDATE
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM admin_emails)
  );

CREATE POLICY "Admins can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM admin_emails)
  );

CREATE POLICY "Admins can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM admin_emails)
  );

CREATE POLICY "Admins can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM admin_emails)
  );

CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM admin_emails)
  );

CREATE POLICY "Admins can view all pricing"
  ON product_pricing FOR SELECT
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM admin_emails)
  );

CREATE POLICY "Admins can insert pricing"
  ON product_pricing FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM admin_emails)
  );

CREATE POLICY "Admins can update pricing"
  ON product_pricing FOR UPDATE
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM admin_emails)
  );

CREATE POLICY "Admins can insert product images"
  ON product_images FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM admin_emails)
  );

CREATE POLICY "Admins can delete product images"
  ON product_images FOR DELETE
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM admin_emails)
  );

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM admin_emails)
  );

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM admin_emails)
  );

CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM admin_emails)
  );

-- Update admin check policies for customers, operators, visits, sales
DROP POLICY IF EXISTS "Dealers can view own customers" ON customers;
CREATE POLICY "Dealers can view own customers"
  ON customers FOR SELECT
  TO authenticated
  USING (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    ) OR
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM admin_emails)
  );

DROP POLICY IF EXISTS "Dealers can view customer branches" ON customer_branches;
CREATE POLICY "Dealers can view customer branches"
  ON customer_branches FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers
      WHERE dealer_id IN (
        SELECT id FROM dealers WHERE user_id = auth.uid()
      )
    ) OR
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM admin_emails)
  );

DROP POLICY IF EXISTS "Dealers can view own operators" ON operators;
CREATE POLICY "Dealers can view own operators"
  ON operators FOR SELECT
  TO authenticated
  USING (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    ) OR
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM admin_emails)
  );

DROP POLICY IF EXISTS "Dealers can view own visits" ON visits;
CREATE POLICY "Dealers can view own visits"
  ON visits FOR SELECT
  TO authenticated
  USING (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    ) OR
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM admin_emails)
  );

DROP POLICY IF EXISTS "Dealers can view own sales" ON sales;
CREATE POLICY "Dealers can view own sales"
  ON sales FOR SELECT
  TO authenticated
  USING (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    ) OR
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM admin_emails)
  );
