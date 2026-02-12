# 🚨 Quick Fix: Bucket Not Found Error

## The Error You're Seeing:
```
Error [StorageApiError]: Bucket not found
```

## ⚡ Quick Fix (2 Minutes):

### Step 1: Create the Bucket
1. **Go to:** https://app.supabase.com/project/cunyrukxlqqilrjburow/storage/buckets
2. **Click:** "New bucket" button (top right)
3. **Enter:**
   - Name: `product-images`
   - Public: ✅ **Check this box** (very important!)
4. **Click:** "Create bucket"

### Step 2: Set Up Storage Policies
1. **Go to:** https://app.supabase.com/project/cunyrukxlqqilrjburow/editor
2. **Copy this SQL:**

```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access
CREATE POLICY "Allow public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Allow users to delete their own images
CREATE POLICY "Allow user delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

3. **Click:** "Run" button
4. **Verify:** Should see "Success. No rows returned"

### Step 3: Test Again
1. Go back to `/dashboard/import`
2. Select posts and proceed to workbench
3. Fill in product details
4. Click "Final Sync"
5. Should now work! ✅

## 🎯 What This Does:

- **Creates storage bucket** for product images
- **Sets permissions** so:
  - ✅ You can upload images
  - ✅ Everyone can view images (public)
  - ✅ You can only delete your own images

## ✅ Verification:

After setup, check:
- Go to: https://app.supabase.com/project/cunyrukxlqqilrjburow/storage/buckets
- You should see `product-images` bucket listed
- Import should work without errors

## 📚 More Details:

See `docs/supabase-storage-setup.sql` for complete setup instructions and explanations.
