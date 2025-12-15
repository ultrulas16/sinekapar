/*
  # Create Storage Bucket for Product Images
  
  1. New Storage Bucket
    - Create 'product-images' bucket for storing product photos
    - Public access for viewing images
    - Authenticated upload for admins
    
  2. Security
    - Anyone can view images (public bucket)
    - Only admins can upload images
    - Only admins can delete images
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;

-- Allow public read access
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- Allow admins to upload
CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images' AND
    auth.uid() IN (SELECT user_id FROM admin_emails WHERE user_id IS NOT NULL)
  );

-- Allow admins to delete
CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND
    auth.uid() IN (SELECT user_id FROM admin_emails WHERE user_id IS NOT NULL)
  );

-- Allow admins to update
CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND
    auth.uid() IN (SELECT user_id FROM admin_emails WHERE user_id IS NOT NULL)
  );
