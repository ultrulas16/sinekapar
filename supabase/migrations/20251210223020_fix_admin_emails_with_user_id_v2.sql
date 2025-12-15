/*
  # Fix Admin Access with User ID
  
  1. Changes
    - Add user_id column to admin_emails table
    - Populate it with existing admin user IDs
    - Drop the recursive policies and function in correct order
    - Create simple, non-recursive RLS policy
    
  2. Security
    - Simple check: auth.uid() IN (SELECT user_id FROM admin_emails)
    - No dependency on auth.users table
    - No recursive policy checks
*/

-- Drop the problematic admin policy FIRST
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Drop the problematic function
DROP FUNCTION IF EXISTS is_admin();

-- Add user_id column to admin_emails
ALTER TABLE admin_emails ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Populate user_id for existing admin emails
UPDATE admin_emails 
SET user_id = (SELECT id FROM auth.users WHERE auth.users.email = admin_emails.email)
WHERE user_id IS NULL;

-- Create simple, non-recursive admin policy
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM admin_emails WHERE user_id IS NOT NULL)
  );

-- Create RLS policy for admin_emails so it's readable
ALTER TABLE admin_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin emails are readable by authenticated users"
  ON admin_emails FOR SELECT
  TO authenticated
  USING (true);
