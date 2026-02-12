-- ============================================================================
-- SUPABASE STORAGE: Setup for Instagram Import
-- ============================================================================
-- Run this in Supabase SQL Editor after creating the bucket
-- https://app.supabase.com/project/cunyrukxlqqilrjburow/editor

-- STEP 1: Create the bucket (do this in Storage UI first)
-- Go to: https://app.supabase.com/project/cunyrukxlqqilrjburow/storage/buckets
-- Click "New bucket"
-- Name: product-images
-- Public: Yes
-- Then run the policies below:

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Policy 1: Allow authenticated users to upload to their own folder
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow public read access to all images
CREATE POLICY "Allow public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Policy 3: Allow users to update their own images
CREATE POLICY "Allow user update own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow users to delete their own images
CREATE POLICY "Allow user delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running the policies, verify them with:

SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%product-images%' OR policyname LIKE '%authenticated%' OR policyname LIKE '%public read%';

-- ============================================================================
-- TESTING
-- ============================================================================
-- Test the setup:
-- 1. Log in to your app
-- 2. Go to /dashboard/import
-- 3. Select some posts and proceed to workbench
-- 4. Fill in details and click "Final Sync"
-- 5. Check Supabase Storage to see uploaded images in:
--    product-images/{your-user-id}/filename.jpg

-- ============================================================================
-- BUCKET CONFIGURATION (optional)
-- ============================================================================
-- You can also configure these settings in the Supabase UI:

-- Maximum file size: 5MB (5242880 bytes)
-- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
-- File size limit: Prevents users from uploading very large files

-- ============================================================================
-- CORS CONFIGURATION (if needed)
-- ============================================================================
-- If you face CORS issues, add these headers in Supabase Storage settings:
-- Access-Control-Allow-Origin: *
-- Access-Control-Allow-Methods: GET, POST, PUT, DELETE
-- Access-Control-Allow-Headers: *

-- ============================================================================
-- CLEANUP (optional)
-- ============================================================================
-- To remove old/unused images, you can run:
-- (Be careful! This deletes files permanently)

-- Delete images older than 30 days from a specific user:
-- DELETE FROM storage.objects
-- WHERE bucket_id = 'product-images'
-- AND created_at < NOW() - INTERVAL '30 days'
-- AND (storage.foldername(name))[1] = 'user-id-here';

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. The bucket MUST be created manually in the UI first
-- 2. The bucket MUST be set to "Public" for images to be accessible
-- 3. Each user's images are stored in their own folder (user-id/)
-- 4. Users can only modify/delete their own images (enforced by policies)
-- 5. Anyone can read images (public access)
-- 6. Images are stored with unique filenames to prevent collisions
-- ============================================================================
