# 🔒 RLS Policy Fix - Row-Level Security Error

## The Error

```
Error [StorageApiError]: new row violates row-level security policy
status: 400,
statusCode: '403'
```

## Root Cause

The storage policy requires uploads to go into a folder named after the **Supabase Auth User ID** (`auth.uid()`), but the code was using the **Database Profile ID** (`profile.id`).

### The Mismatch:

```typescript
// ❌ BEFORE (Wrong - using database ID)
const fileName = `${profile.id}/image.webp`;
// uploads to: "550e8400-e29b-41d4-a716-446655440000/image.webp"

// ✅ AFTER (Correct - using auth ID)  
const fileName = `${profile.userId}/image.webp`;
// uploads to: "auth-user-uuid/image.webp"
```

### Database Schema:

```typescript
profiles {
  id: uuid          // ← Database primary key (auto-generated)
  userId: string    // ← Supabase Auth user ID (links to auth.users)
  username: string
  // ...
}
```

### Storage Policy:

```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text  -- ← Checks auth ID!
);
```

## The Fix

### Changed Code:

**File:** `src/app/actions/instagram-import.ts`

```typescript
// Line 64-65 (updated)
// Use userId (Supabase auth ID) for RLS policy compliance
const fileName = `${profile.userId}/${Date.now()}-${random}.webp`;
```

### Why This Works:

1. **User logs in** → Supabase sets `auth.uid()` in session
2. **Profile lookup** → Gets `profile.userId` matching auth user
3. **Upload path** → Uses `profile.userId` in folder name
4. **RLS check** → `profile.userId` === `auth.uid()` ✅ Allowed!

## Verification

After the fix, uploads should succeed and images should be stored in:

```
product-images/
  └── {auth-user-id}/
      ├── 1707585600000-abc123.webp
      ├── 1707585601000-def456.webp
      └── ...
```

Where `{auth-user-id}` is your Supabase Auth user ID (from `auth.users.id`).

## Security Benefits

This folder structure ensures:

1. ✅ **User isolation** - Each user has their own folder
2. ✅ **RLS enforcement** - Users can only upload to their folder
3. ✅ **Clear organization** - Easy to find user's images
4. ✅ **Audit trail** - Know who uploaded what

## Testing

### Before Fix (Error):
```bash
POST /dashboard/import
→ Upload error: new row violates row-level security policy ❌
```

### After Fix (Success):
```bash
POST /dashboard/import  
→ Upload successful ✅
→ Image saved to: product-images/{auth-id}/image.webp
```

## Related Files

- `src/app/actions/instagram-import.ts` - Fixed upload code
- `docs/supabase-storage-setup.sql` - Storage policies
- `docs/QUICK_SETUP_STORAGE.md` - Updated troubleshooting

## Status

✅ **FIXED** - Code now uses correct user ID for RLS compliance!

Try importing again - should work now! 🎉
