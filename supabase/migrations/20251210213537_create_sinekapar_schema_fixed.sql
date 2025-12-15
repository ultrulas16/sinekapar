/*
  # SineKapar Multi-Tenant CRM and E-commerce Platform

  ## Overview
  Complete database schema for SineKapar fly trap device company with:
  - Multi-tenant architecture (Admin, Dealers, Operators, Customers)
  - Product management with dynamic pricing
  - Pest control CRM features
  - E-commerce for end users

  ## New Tables

  1. **profiles**
     - Extended user information for all users
     - Links to auth.users
     - Stores role: admin, dealer, operator, customer, customer_branch, end_user
     - Includes full_name, phone, company info

  2. **dealers**
     - Pest control companies (ilaçlama firmaları/bayiler)
     - Company information, registration details
     - Status: pending, active, suspended
     - Special pricing tier

  3. **products**
     - Fly trap devices and equipment
     - Base price, description, specifications
     - Stock management

  4. **product_images**
     - Multiple images per product
     - Display order, main image flag

  5. **product_pricing**
     - Dealer-specific pricing
     - Allows different prices for each dealer

  6. **customers**
     - Dealer's customers (müşteriler)
     - Belongs to a specific dealer
     - Contact and location info

  7. **customer_branches**
     - Sub-locations for customers (şubeler)
     - Each customer can have multiple branches

  8. **operators**
     - Field workers for dealers (operatörler)
     - Belongs to a dealer
     - Can be assigned to visits

  9. **visits**
     - Service visits (ziyaretler)
     - Tracks date, operator, customer branch
     - Visit notes and status

  10. **sales**
      - Material and service sales (malzeme satışları)
      - Links to visits or standalone
      - Payment tracking

  11. **cart**
      - Shopping cart for end users
      - Temporary storage before checkout

  12. **orders**
      - Order history for all user types
      - Different pricing based on user role

  ## Security
  - Row Level Security enabled on all tables
  - Role-based access policies
  - Admins: Full access
  - Dealers: Access to their data and customers
  - Operators: Limited to assigned tasks
  - Customers: View their own data
  - End Users: Standard e-commerce access

  ## Important Notes
  1. Multi-tenant isolation ensures dealers only see their data
  2. Cascade deletes maintain referential integrity
  3. Timestamps track all changes
  4. Soft delete patterns where appropriate
*/

-- Create enum types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'dealer', 'operator', 'customer', 'customer_branch', 'end_user');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE dealer_status AS ENUM ('pending', 'active', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE visit_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Dealers table (İlaçlama firmaları/Bayiler) - Create first
CREATE TABLE IF NOT EXISTS dealers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  tax_number text,
  address text,
  city text,
  phone text NOT NULL,
  email text NOT NULL,
  status dealer_status DEFAULT 'pending',
  discount_rate numeric(5,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'end_user',
  full_name text NOT NULL,
  phone text,
  avatar_url text,
  dealer_id uuid REFERENCES dealers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  specifications text,
  base_price numeric(10,2) NOT NULL,
  dealer_price numeric(10,2) NOT NULL,
  stock_quantity integer DEFAULT 0,
  sku text UNIQUE,
  is_active boolean DEFAULT true,
  category text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product images table
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  display_order integer DEFAULT 0,
  is_main boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Product pricing (dealer-specific pricing)
CREATE TABLE IF NOT EXISTS product_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  dealer_id uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  custom_price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, dealer_id)
);

-- Customers table (Bayinin müşterileri)
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  address text,
  city text,
  tax_number text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customer branches table (Müşteri şubeleri)
CREATE TABLE IF NOT EXISTS customer_branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  branch_name text NOT NULL,
  address text NOT NULL,
  city text,
  contact_person text,
  phone text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Operators table (Operatörler)
CREATE TABLE IF NOT EXISTS operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  email text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Visits table (Ziyaretler)
CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_branch_id uuid REFERENCES customer_branches(id) ON DELETE SET NULL,
  operator_id uuid REFERENCES operators(id) ON DELETE SET NULL,
  visit_date timestamptz NOT NULL,
  status visit_status DEFAULT 'scheduled',
  service_type text,
  notes text,
  completion_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sales table (Malzeme satışları)
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  visit_id uuid REFERENCES visits(id) ON DELETE SET NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  payment_status text DEFAULT 'pending',
  sale_date timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Orders table (Sipariş geçmişi)
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dealer_id uuid REFERENCES dealers(id) ON DELETE SET NULL,
  order_number text UNIQUE NOT NULL,
  status order_status DEFAULT 'pending',
  total_amount numeric(10,2) NOT NULL,
  shipping_address text NOT NULL,
  shipping_city text,
  phone text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Shopping cart table
CREATE TABLE IF NOT EXISTS cart (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_dealer_id ON profiles(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealers_status ON dealers(status);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_dealer_id ON customers(dealer_id);
CREATE INDEX IF NOT EXISTS idx_customer_branches_customer_id ON customer_branches(customer_id);
CREATE INDEX IF NOT EXISTS idx_operators_dealer_id ON operators(dealer_id);
CREATE INDEX IF NOT EXISTS idx_visits_dealer_id ON visits(dealer_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_sales_dealer_id ON sales(dealer_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for dealers
CREATE POLICY "Dealers can view own data"
  ON dealers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all dealers"
  ON dealers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can insert dealer registration"
  ON dealers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Dealers can update own data"
  ON dealers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can update dealers"
  ON dealers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for products
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for product_images
CREATE POLICY "Anyone can view product images"
  ON product_images FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert product images"
  ON product_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete product images"
  ON product_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for product_pricing
CREATE POLICY "Dealers can view own pricing"
  ON product_pricing FOR SELECT
  TO authenticated
  USING (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all pricing"
  ON product_pricing FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert pricing"
  ON product_pricing FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update pricing"
  ON product_pricing FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for customers
CREATE POLICY "Dealers can view own customers"
  ON customers FOR SELECT
  TO authenticated
  USING (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Dealers can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Dealers can update own customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Dealers can delete own customers"
  ON customers FOR DELETE
  TO authenticated
  USING (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for customer_branches
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
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Dealers can insert customer branches"
  ON customer_branches FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers
      WHERE dealer_id IN (
        SELECT id FROM dealers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Dealers can update customer branches"
  ON customer_branches FOR UPDATE
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers
      WHERE dealer_id IN (
        SELECT id FROM dealers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Dealers can delete customer branches"
  ON customer_branches FOR DELETE
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers
      WHERE dealer_id IN (
        SELECT id FROM dealers WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for operators
CREATE POLICY "Dealers can view own operators"
  ON operators FOR SELECT
  TO authenticated
  USING (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Dealers can insert operators"
  ON operators FOR INSERT
  TO authenticated
  WITH CHECK (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Dealers can update operators"
  ON operators FOR UPDATE
  TO authenticated
  USING (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Dealers can delete operators"
  ON operators FOR DELETE
  TO authenticated
  USING (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for visits
CREATE POLICY "Dealers can view own visits"
  ON visits FOR SELECT
  TO authenticated
  USING (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Dealers can insert visits"
  ON visits FOR INSERT
  TO authenticated
  WITH CHECK (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Dealers can update visits"
  ON visits FOR UPDATE
  TO authenticated
  USING (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Dealers can delete visits"
  ON visits FOR DELETE
  TO authenticated
  USING (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for sales
CREATE POLICY "Dealers can view own sales"
  ON sales FOR SELECT
  TO authenticated
  USING (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Dealers can insert sales"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Dealers can update sales"
  ON sales FOR UPDATE
  TO authenticated
  USING (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for order_items
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for cart
CREATE POLICY "Users can view own cart"
  ON cart FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert to cart"
  ON cart FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cart"
  ON cart FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete from cart"
  ON cart FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dealers_updated_at ON dealers;
CREATE TRIGGER update_dealers_updated_at BEFORE UPDATE ON dealers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_branches_updated_at ON customer_branches;
CREATE TRIGGER update_customer_branches_updated_at BEFORE UPDATE ON customer_branches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_operators_updated_at ON operators;
CREATE TRIGGER update_operators_updated_at BEFORE UPDATE ON operators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_visits_updated_at ON visits;
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();