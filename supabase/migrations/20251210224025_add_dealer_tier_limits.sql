/*
  # Add Dealer Tier Limits Configuration
  
  1. New Table: dealer_tier_limits
    - Stores limits for each dealer tier
    - max_customers: Maximum number of customers per tier
    - max_operators: Maximum number of operators per tier
    - max_visits_per_month: Maximum visits that can be scheduled per month
    
  2. Initial Data
    - Tier 1 (Premium): 100 customers, 20 operators, unlimited visits
    - Tier 2 (Standart): 50 customers, 10 operators, 500 visits/month
    - Tier 3 (Temel): 20 customers, 5 operators, 200 visits/month
    
  3. Security
    - Enable RLS
    - Everyone can read limits (needed for validation)
    - Only admins can modify limits
*/

-- Create dealer tier limits table
CREATE TABLE IF NOT EXISTS dealer_tier_limits (
  tier integer PRIMARY KEY CHECK (tier IN (1, 2, 3)),
  max_customers integer NOT NULL,
  max_operators integer NOT NULL,
  max_visits_per_month integer NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default limits
INSERT INTO dealer_tier_limits (tier, max_customers, max_operators, max_visits_per_month, description)
VALUES 
  (1, 100, 20, 9999, 'Premium - En yüksek limitler'),
  (2, 50, 10, 500, 'Standart - Orta seviye limitler'),
  (3, 20, 5, 200, 'Temel - Başlangıç limitleri')
ON CONFLICT (tier) DO NOTHING;

-- Enable RLS
ALTER TABLE dealer_tier_limits ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read limits (needed for validation)
CREATE POLICY "Anyone can view tier limits"
  ON dealer_tier_limits FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can update limits
CREATE POLICY "Admins can update tier limits"
  ON dealer_tier_limits FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM admin_emails WHERE user_id IS NOT NULL)
  );

-- Add helpful comment
COMMENT ON TABLE dealer_tier_limits IS 'Defines maximum limits for each dealer tier level';
