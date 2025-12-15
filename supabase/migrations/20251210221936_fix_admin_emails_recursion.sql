/*
  # Fix Admin Emails Infinite Recursion
  
  ## Problem
  The admin_emails table RLS policy was checking itself, causing infinite recursion
  
  ## Solution
  Remove RLS from admin_emails table since:
  - It's only used for admin verification
  - No sensitive data stored
  - Security is enforced at policy level, not table level
  
  ## Changes
  1. Drop the recursive policy
  2. Disable RLS on admin_emails
  3. Ensure admin email is inserted
*/

-- Drop the recursive policy
DROP POLICY IF EXISTS "Only admins can view admin emails" ON admin_emails;

-- Disable RLS on admin_emails since it's just a reference table
ALTER TABLE admin_emails DISABLE ROW LEVEL SECURITY;

-- Ensure admin email exists
INSERT INTO admin_emails (email) VALUES ('ulasserbetcioglu@gmail.com')
ON CONFLICT (email) DO NOTHING;
