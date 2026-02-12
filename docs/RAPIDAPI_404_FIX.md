# 🔧 RapidAPI 404 Error - Quick Fix

## The Error

```
RapidAPI error: 404 Not Found
```

## Root Cause

The API endpoint URL in the code doesn't match your subscribed RapidAPI service. Each Instagram API on RapidAPI has different endpoint paths.

## ✅ How to Fix (5 Minutes)

### Step 1: Find Your API's Correct Endpoint

1. **Go to your RapidAPI dashboard:**
   ```
   https://rapidapi.com/developer/apps
   ```

2. **Click on your subscribed Instagram API**

3. **Go to "Endpoints" tab**

4. **Find the endpoint for getting user posts/profile**
   - Look for endpoints like:
     - "Get User Posts"
     - "User Profile"
     - "User Media"
     - "Get Profile Info"

5. **Copy the endpoint URL from the code example**

### Step 2: Update the Code

Open `src/app/actions/instagram.ts` (around line 52) and update the `apiUrl`:

**Common Instagram API Endpoints:**

#### Option 1: Instagram Scraper API
```typescript
const apiUrl = `https://${apiHost}/v1/info?username_or_id_or_url=${encodeURIComponent(username)}`;
```

#### Option 2: Instagram Bulk Profile Scrapper
```typescript
const apiUrl = `https://${apiHost}/clients/api/ig/ig_profile?ig=${encodeURIComponent(username)}`;
```

#### Option 3: Instagram Profile & Posts API
```typescript
const apiUrl = `https://${apiHost}/user?username=${encodeURIComponent(username)}`;
```

#### Option 4: Instagram Data API
```typescript
const apiUrl = `https://${apiHost}/profile/${encodeURIComponent(username)}`;
```

### Step 3: Update Response Mapping (If Needed)

After changing the endpoint, check the response structure. In the RapidAPI interface, look at the "Example Response" to see how data is structured.

Update the mapping in `instagram.ts` around line 95-130 if the fields are different.

## 🎯 Quick Test

### Method 1: Using RapidAPI Test Console

1. Go to your API's "Endpoints" tab
2. Find the user/profile endpoint
3. Click "Test Endpoint"
4. Enter `nasa` as username
5. Click "Test"
6. See the actual response structure
7. Update code to match!

### Method 2: Check Response in Console

Temporarily add console.log in the code:

```typescript
// In src/app/actions/instagram.ts, after fetch:
const data = await response.json();
console.log("API Response:", JSON.stringify(data, null, 2));
```

Then check your terminal to see the actual structure.

## 📋 Common API Services & Their Endpoints

### 1. Instagram Scraper API (Recommended)

**Host:** `instagram-scraper-api2.p.rapidapi.com`

**Endpoint:**
```
GET /v1/info?username_or_id_or_url=nasa
```

**Response:**
```json
{
  "data": {
    "user": {
      "edge_owner_to_timeline_media": {
        "edges": [
          {
            "node": {
              "id": "...",
              "display_url": "...",
              "edge_media_to_caption": { "edges": [...] }
            }
          }
        ]
      }
    }
  }
}
```

### 2. Instagram Bulk Profile Scrapper

**Host:** `instagram-bulk-profile-scrapper.p.rapidapi.com`

**Endpoint:**
```
GET /clients/api/ig/ig_profile?ig=nasa
```

**Response:**
```json
{
  "user": {
    "posts": [
      {
        "pk": "...",
        "image_versions2": { "candidates": [...] }
      }
    ]
  }
}
```

### 3. Instagram Profile & Media API

**Host:** `instagram-profile-media.p.rapidapi.com`

**Endpoint:**
```
GET /profile?username=nasa
```

**Response:**
```json
{
  "media": [
    {
      "id": "...",
      "media_url": "...",
      "caption": "..."
    }
  ]
}
```

## 🔍 Debugging Steps

### Step 1: Check Which API You're Using

```bash
# In your terminal, check .env
cat .env | grep RAPIDAPI_HOST
```

This tells you which API you subscribed to.

### Step 2: Match the Endpoint

Go to that specific API's page on RapidAPI and find the correct endpoint path.

### Step 3: Update Code

Update line 52 in `src/app/actions/instagram.ts`:

```typescript
const apiUrl = `https://${apiHost}/YOUR_CORRECT_ENDPOINT_HERE`;
```

### Step 4: Update Response Mapping

Based on the "Example Response" in RapidAPI, update the mapping around lines 95-130.

## 💡 Pro Tip

If you tell me:
1. Which Instagram API you subscribed to (exact name)
2. The example response structure from RapidAPI

I can give you the exact code to use! Just paste the example response and I'll map it correctly.

## 🆘 Quick Solution: Use Different API

If you're stuck, try this popular Instagram API:

1. **Go to:** https://rapidapi.com/restyler/api/instagram-scraper-api2
2. **Subscribe** (500 free requests/month)
3. **Update .env:**
   ```env
   RAPIDAPI_HOST=instagram-scraper-api2.p.rapidapi.com
   ```
4. **Update endpoint in code:**
   ```typescript
   const apiUrl = `https://${apiHost}/v1/info?username_or_id_or_url=${username}`;
   ```

## 📚 Documentation

- **This Guide:** `docs/RAPIDAPI_404_FIX.md`
- **Setup Guide:** `docs/RAPIDAPI_SETUP_GUIDE.md`
- **Code Location:** `src/app/actions/instagram.ts` (line 52)

## ✅ Next Steps

1. Find your API's correct endpoint in RapidAPI
2. Update line 52 in `instagram.ts`
3. Restart server: `pnpm dev`
4. Test again with "nasa"

**Need help?** Share your RapidAPI service name and I'll give you the exact endpoint! 🚀
