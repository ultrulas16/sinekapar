/*
  # İade Sistemi
  
  1. Yeni Tablolar
    
    ## returns (İadeler)
    - `id` (uuid, primary key)
    - `order_id` (uuid, references orders)
    - `user_id` (uuid, references auth.users)
    - `return_number` (text, unique) - İade numarası
    - `status` (text) - pending, approved, rejected, completed
    - `reason` (text) - İade nedeni
    - `notes` (text) - İade notları
    - `refund_amount` (decimal) - İade tutarı
    - `admin_notes` (text) - Admin notları
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
    
    ## return_items (İade Kalemleri)
    - `id` (uuid, primary key)
    - `return_id` (uuid, references returns)
    - `order_item_id` (uuid, references order_items)
    - `product_id` (uuid, references products)
    - `product_name` (text)
    - `quantity` (integer) - İade edilen miktar
    - `unit_price` (decimal)
    - `total_price` (decimal)
    - `created_at` (timestamptz)
  
  2. Güvenlik (RLS)
    - Tüm tablolarda RLS aktif
    - Kullanıcılar sadece kendi kayıtlarını görebilir
    - Adminler tüm kayıtları görebilir ve yönetebilir
*/

-- Create return_status enum if not exists
DO $$ BEGIN
  CREATE TYPE return_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Returns Table
CREATE TABLE IF NOT EXISTS returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  return_number text UNIQUE NOT NULL,
  status return_status DEFAULT 'pending',
  reason text NOT NULL,
  notes text,
  admin_notes text,
  refund_amount decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Return Items Table
CREATE TABLE IF NOT EXISTS return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid REFERENCES returns(id) ON DELETE CASCADE NOT NULL,
  order_item_id uuid REFERENCES order_items(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_user_id ON returns(user_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON return_items(return_id);

-- Enable RLS on all tables
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;

-- Returns Policies
CREATE POLICY "Users can view own returns"
  ON returns FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own returns"
  ON returns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all returns"
  ON returns FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM admin_emails WHERE user_id IS NOT NULL));

CREATE POLICY "Admins can update all returns"
  ON returns FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM admin_emails WHERE user_id IS NOT NULL));

-- Return Items Policies
CREATE POLICY "Users can view own return items"
  ON return_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM returns
      WHERE returns.id = return_items.return_id
      AND returns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert return items for own returns"
  ON return_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM returns
      WHERE returns.id = return_items.return_id
      AND returns.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all return items"
  ON return_items FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM admin_emails WHERE user_id IS NOT NULL));

-- Function to generate return number
CREATE OR REPLACE FUNCTION generate_return_number()
RETURNS text AS $$
BEGIN
  RETURN 'RET-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON TABLE returns IS 'Product return requests from customers';
COMMENT ON TABLE return_items IS 'Individual items in each return request';
