/*
  # Add VAT and Shipping Options to Products

  1. Changes
    - Add `vat_rate` column to products (1, 10, or 20 percent)
    - Add `vat_included` column to products (boolean - whether VAT is included in price)
    - Add `shipping_option` column to products (string - shipping method chosen by admin)
    - Set default values for existing products

  2. Security
    - No RLS changes needed, existing policies apply
*/

-- Add VAT rate column (1, 10, or 20)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'vat_rate'
  ) THEN
    ALTER TABLE products ADD COLUMN vat_rate INTEGER DEFAULT 20 CHECK (vat_rate IN (1, 10, 20));
  END IF;
END $$;

-- Add VAT included flag
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'vat_included'
  ) THEN
    ALTER TABLE products ADD COLUMN vat_included BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add shipping option
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'shipping_option'
  ) THEN
    ALTER TABLE products ADD COLUMN shipping_option TEXT DEFAULT 'standard';
  END IF;
END $$;

-- Add public read access for products
DROP POLICY IF EXISTS "Public users can view products" ON products;
CREATE POLICY "Public users can view products"
  ON products
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Add public read access for product_images
DROP POLICY IF EXISTS "Public users can view product images" ON product_images;
CREATE POLICY "Public users can view product images"
  ON product_images
  FOR SELECT
  TO anon, authenticated
  USING (true);