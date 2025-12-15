/*
  # Add Dealer Tiers and Multi-Level Pricing
  
  1. Changes to dealers table
    - Add `tier` column (1, 2, or 3) to indicate dealer level
    - Tier 1: Premium dealers with best pricing
    - Tier 2: Standard dealers with standard pricing
    - Tier 3: Basic dealers with basic pricing
    
  2. Changes to products table
    - Remove single `dealer_price` column
    - Add `dealer_tier1_price`, `dealer_tier2_price`, `dealer_tier3_price`
    - Each tier gets its own pricing
    
  3. Security
    - Keep existing RLS policies
*/

-- Add tier column to dealers table
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS tier integer DEFAULT 2 CHECK (tier IN (1, 2, 3));

-- Add comment for clarity
COMMENT ON COLUMN dealers.tier IS 'Dealer tier level: 1 (Premium), 2 (Standard), 3 (Basic)';

-- Add new pricing columns to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS dealer_tier1_price numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS dealer_tier2_price numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS dealer_tier3_price numeric;

-- Migrate existing dealer_price to tier2_price (standard)
UPDATE products 
SET dealer_tier1_price = dealer_price * 0.9,
    dealer_tier2_price = dealer_price,
    dealer_tier3_price = dealer_price * 1.1
WHERE dealer_tier2_price IS NULL;

-- Make the new columns required
ALTER TABLE products ALTER COLUMN dealer_tier1_price SET NOT NULL;
ALTER TABLE products ALTER COLUMN dealer_tier2_price SET NOT NULL;
ALTER TABLE products ALTER COLUMN dealer_tier3_price SET NOT NULL;

-- Drop the old dealer_price column
ALTER TABLE products DROP COLUMN IF EXISTS dealer_price;
