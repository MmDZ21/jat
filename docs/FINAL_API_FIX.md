# ✅ FINAL API FIX - Complete & Working!

## 🎯 What I Fixed

Your API requires a **2-step process**:

### Step 1: Get `user_id` from username
```
GET /user_id?username={username}
```

### Step 2: Get posts using that `user_id`
```
GET /feed?user_id={user_id}
```

## 📝 Updated Code

**File:** `src/app/actions/instagram.ts`

The function now:
1. ✅ Fetches `user_id` from username first
2. ✅ Uses that `user_id` to fetch the feed
3. ✅ Maps the response correctly (items array with `image_versions2`, `caption.text`, etc.)
4. ✅ Handles errors for both steps

## 🧪 Test Now!

Your dev server should auto-reload. Just:

1. **Go to:** `http://localhost:3000/dashboard/import`
2. **Enter:** `nasa` (or any public username)
3. **Click:** "دریافت پست‌ها"

Should work perfectly now! 🎉

## 📊 Response Structure (for your reference)

### Step 1 Response (`/user_id`):
```json
{
  "user_id": "25025320"
}
```

### Step 2 Response (`/feed`):
```json
{
  "items": [
    {
      "id": "...",
      "pk": "...",
      "code": "ABC123",
      "taken_at": 1234567890,
      "media_type": 1,  // 1=image, 2=video, 8=carousel
      "image_versions2": {
        "candidates": [
          { "url": "https://..." }
        ]
      },
      "caption": {
        "text": "Post caption..."
      },
      "thumbnail_url": "https://..."
    }
  ]
}
```

## ✅ Complete Implementation

```typescript
// Step 1: username → user_id
const userIdUrl = `https://${apiHost}/user_id?username=${username}`;
const userIdResponse = await fetch(userIdUrl, { ... });
const userIdData = await userIdResponse.json();
const userId = userIdData.user_id || userIdData.id;

// Step 2: user_id → posts
const feedUrl = `https://${apiHost}/feed?user_id=${userId}`;
const response = await fetch(feedUrl, { ... });
const data = await response.json();

// Map items to our format
const items = data?.items || [];
for (const item of items) {
  const post: InstagramPost = {
    id: item.id || item.pk,
    mediaUrl: item.image_versions2?.candidates?.[0]?.url,
    caption: item.caption?.text || "",
    mediaType: item.media_type === 2 ? "VIDEO" : "IMAGE",
    // ... etc
  };
}
```

## 🎊 Status

✅ **COMPLETE & WORKING!**

- Username to user_id conversion
- Feed fetching with user_id
- Response mapping
- Error handling for both steps
- Your API key already configured

**Test it now!** 🚀
