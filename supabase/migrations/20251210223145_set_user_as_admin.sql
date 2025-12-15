/*
  # Set Current User as Admin
  
  1. Changes
    - Update the profile role to 'admin' for ulasserbetcioglu@gmail.com
    - This runs as a migration so it bypasses RLS
    
  2. Security
    - One-time administrative action
*/

-- Update user role to admin
UPDATE profiles 
SET role = 'admin', updated_at = now()
WHERE id = '800de3fb-6a0a-4043-9453-4b97c78e250e';
