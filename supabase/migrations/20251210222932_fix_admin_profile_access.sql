/*
  # Fix Admin Profile Access
  
  1. Problem
    - The "Admins can view all profiles" policy tries to access auth.users table
    - This causes permission errors under RLS
    
  2. Solution
    - Drop the problematic admin policy
    - Admin users can view their own profile with the existing "Users can view own profile" policy
    - Add a simpler policy for admins to view all profiles using a security definer function
    
  3. Security
    - Use a security definer function that safely checks admin status
    - Function runs with elevated privileges but only returns boolean
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create a security definer function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Create new admin policy using the function
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin());
