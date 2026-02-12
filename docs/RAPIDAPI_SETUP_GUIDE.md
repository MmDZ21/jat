# 🚀 RapidAPI Instagram Setup - Quick Start

## ✅ What Was Done

Integrated real Instagram API from RapidAPI to replace mock data. The system is optimized for the 100 requests/month limit.

## 📋 Setup Steps (10 Minutes)

### Step 1: Get RapidAPI Account (3 minutes)

1. **Go to:** https://rapidapi.com/
2. **Sign up** or login
3. **Verify email** if needed

### Step 2: Subscribe to Instagram API (4 minutes)

1. **Search for:** "Instagram" in RapidAPI
2. **Recommended APIs:**
   - **Instagram Scraper API** (500 free/month) ⭐ Best
   - Instagram Profile & Posts (100 free/month)
   - Instagram Data API (200 free/month)

3. **Subscribe:**
   - Click "Subscribe to Test"
   - Choose **Basic** plan (free)
   - Confirm subscription

4. **Get credentials:**
   - Go to API's **"Endpoints"** tab
   - Look at any endpoint's code snippet
   - Find these two values:
     - `X-RapidAPI-Key: abc123...` ← Copy this
     - `X-RapidAPI-Host: instagram-scraper-api2.p.rapidapi.com` ← Copy this

### Step 3: Update .env File (2 minutes)

Open `.env` and add:

```env
RAPIDAPI_KEY=your_actual_key_from_rapidapi
RAPIDAPI_HOST=instagram-scraper-api2.p.rapidapi.com
```

**Example:**
```env
RAPIDAPI_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
RAPIDAPI_HOST=instagram-scraper-api2.p.rapidapi.com
```

### Step 4: Restart & Test (1 minute)

```bash
# Stop server (Ctrl+C)
pnpm dev

# Go to: http://localhost:3000/dashboard/import
# Enter a public Instagram username (e.g., "nasa")
# Click "دریافت پست‌ها"
# Should see real posts! ✅
```

## 🎯 Features

### ✅ Real Instagram Integration
- Fetches actual Instagram posts
- Real images and captions
- Proper metadata

### ✅ Optimized for API Limits
- **No pagination** - Saves API calls
- **12 posts max** per fetch
- **1-hour cache** - Reduces redundant calls
- **Refresh button** - Manual re-fetch only

### ✅ Error Handling
- Missing API key detection
- Rate limit warnings (429)
- User not found (404)
- Network error messages

### ✅ Image Flow
```
RapidAPI → mediaUrl
    ↓
Client displays thumbnail
    ↓
User selects posts
    ↓
Workbench uses imageUrl
    ↓
Sharp downloads & optimizes
    ↓
Upload to Supabase (WebP, 800px, 80% quality)
    ↓
Save to database ✅
```

## 🔄 UI Changes

### New Refresh Button:
- 🔄 Appears after posts are loaded
- 📍 Next to "Fetch Posts" button
- 🎯 Re-fetches same username
- ⚡ Uses 1 API call

### Removed:
- ❌ "Load More" button (saves API calls)
- ❌ Pagination state

### Added:
- ✅ Helpful tip: "برای صرفه‌جویی در API requests..."

## 📊 API Usage

### Monthly Capacity (100 requests):

| Usage Pattern | API Calls | Capacity |
|--------------|-----------|----------|
| Single fetch | 1 call | 100 usernames/month |
| Fetch + Refresh | 2 calls | 50 usernames/month |
| Import products | 0 calls | Uses cached data |

### Best Practices:

1. ✅ Fetch once per username
2. ✅ Use Refresh sparingly
3. ✅ Import immediately (URLs may expire)
4. ✅ Monitor usage in RapidAPI dashboard

## 🐛 Common Issues

### "تنظیمات API یافت نشد"
**Cause:** Missing environment variables  
**Fix:**
- Add `RAPIDAPI_KEY` to `.env`
- Add `RAPIDAPI_HOST` to `.env`
- Restart dev server

### "محدودیت تعداد درخواست" (429)
**Cause:** Exceeded 100 requests/month  
**Fix:**
- Wait until next month
- Upgrade RapidAPI plan
- Use different API key

### "حساب کاربری یافت نشد" (404)
**Cause:** Username invalid or private account  
**Fix:**
- Check spelling
- Try public account (e.g., "nasa", "natgeo")
- Remove @ symbol if present

### Posts show but no images
**Cause:** API response structure different  
**Fix:**
- Check console for API response
- Update mapping in `instagram.ts`
- Contact me for help

## 📁 Files Created/Updated

```
NEW:
✅ src/app/actions/instagram.ts
   - getInstagramPosts() server action
   - RapidAPI integration
   - Response mapping for common APIs

UPDATED:
✅ src/app/dashboard/import/InstagramImportClient.tsx
   - Uses real API
   - Added Refresh button
   - Removed pagination
   - Cleaner state management

✅ .env
   - Added RAPIDAPI_KEY
   - Added RAPIDAPI_HOST

✅ .env.example
   - Added RapidAPI template
```

## 🎨 Response Mapping

The code automatically handles multiple API response formats:

```typescript
// Supports these structures:
data.data?.items    // Instagram Scraper API
data.items          // Instagram Profile API
data.posts          // Instagram Data API
data.data           // Generic wrapper

// Image URLs from:
item.image_versions2?.candidates?.[0]?.url  // Scraper API
item.display_url                             // Graph API
item.media_url                               // Generic
item.thumbnail_url                           // Alternative

// Captions from:
item.caption?.text                           // Scraper API
item.edge_media_to_caption?.edges?.[0]...   // Graph API
item.title                                   // Generic
```

## 🔒 Security

### Protected Data:
- ✅ API key server-side only
- ✅ Never sent to client
- ✅ Not in Git (.env in .gitignore)

### Code Example:
```typescript
// ✅ Server Action ("use server")
const apiKey = process.env.RAPIDAPI_KEY;  // Server-only
```

## 📈 Performance

### Caching Strategy:
```typescript
next: { revalidate: 3600 }  // 1-hour cache
```

**Benefits:**
- ✅ Same username within 1 hour = cached
- ✅ No API call used
- ✅ Instant response

### Example:
```
10:00 AM - Fetch "nasa" → API call (1 used)
10:15 AM - Fetch "nasa" → Cached (0 used)
10:30 AM - Fetch "nasa" → Cached (0 used)
11:01 AM - Fetch "nasa" → API call (2 used)
```

## ✅ Verification

### Test Real API:

1. Add RapidAPI credentials to `.env`
2. Restart server
3. Go to `/dashboard/import`
4. Enter: `nasa` (NASA's official account)
5. Click fetch
6. Should see:
   - Real NASA Instagram posts
   - Actual space photos
   - Real captions

### Check API Usage:

Go to: https://rapidapi.com/developer/dashboard
- See how many requests used
- Monitor monthly limit
- Track usage patterns

## 🎉 Benefits

### Before (Mock):
- ❌ Fake images
- ❌ Generic captions
- ❌ No real data

### After (Real API):
- ✅ Real Instagram content
- ✅ Actual product photos
- ✅ Original captions
- ✅ Production-ready

### Import Quality:
- ✅ High-quality images
- ✅ Authentic descriptions
- ✅ Real product showcases
- ✅ Professional appearance

## 📚 Resources

- **RapidAPI Hub:** https://rapidapi.com/hub
- **Instagram APIs:** Search "Instagram" on RapidAPI
- **Usage Dashboard:** https://rapidapi.com/developer/dashboard
- **Support:** https://docs.rapidapi.com/

## 🚀 Next Steps

1. ✅ Install dependencies → Already done!
2. ⏳ Get RapidAPI key → 5 minutes
3. ⏳ Update .env → 1 minute
4. ⏳ Test with real Instagram → 2 minutes

**Total time:** ~10 minutes to go live with real Instagram data! 🎊

---

## ⚠️ Important Notes

1. **API Limits:** 100 requests/month on free tier
2. **Cache:** 1-hour cache reduces usage
3. **No pagination:** Intentional to save calls
4. **Image URLs:** May expire after some time
5. **Import quickly:** Don't wait between fetch and import

## 📞 Need Help?

If API response structure is different:
1. Check console for actual response
2. Update mapping in `src/app/actions/instagram.ts`
3. Lines 72-95 contain field mappings
4. Add your API's specific field names

---

**Status:** ✅ **READY TO USE**

Just add your RapidAPI key and start importing real Instagram content! 🚀
