"use server";

interface InstagramPost {
  id: string;
  mediaUrl: string;
  caption: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  timestamp: string;
  permalink: string;
  thumbnailUrl?: string;
}

interface InstagramApiResponse {
  success: boolean;
  posts: InstagramPost[];
  error?: string;
}

/**
 * Fetch Instagram posts from RapidAPI
 * 
 * @param username - Instagram username to fetch posts from
 * @param limit - Number of posts to fetch (default: 12)
 * @returns Array of Instagram posts or error
 */
export async function getInstagramPosts(
  username: string,
  limit: number = 12
): Promise<InstagramApiResponse> {
  try {
    if (!username || username.trim().length === 0) {
      return {
        success: false,
        posts: [],
        error: "نام کاربری نمی‌تواند خالی باشد",
      };
    }

    // Validate environment variables
    const apiKey = process.env.RAPIDAPI_KEY;
    const apiHost = process.env.RAPIDAPI_HOST;

    if (!apiKey || !apiHost) {
      console.error("Missing RapidAPI credentials");
      return {
        success: false,
        posts: [],
        error: "تنظیمات API یافت نشد. لطفاً با مدیر تماس بگیرید.",
      };
    }

    // Instagram API – Fast & Reliable Data Scraper
    // Step 1: Get user_id from username
    // Try common endpoint variations
    const userIdUrl = `https://${apiHost}/user_id_by_username?username=${encodeURIComponent(username)}`;
    
    const userIdResponse = await fetch(userIdUrl, {
      method: "GET",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": apiHost,
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!userIdResponse.ok) {
      console.error(`RapidAPI error getting user_id: ${userIdResponse.status} ${userIdResponse.statusText}`);
      
      if (userIdResponse.status === 404) {
        return {
          success: false,
          posts: [],
          error: "حساب کاربری یافت نشد. لطفاً نام کاربری را بررسی کنید.",
        };
      }

      if (userIdResponse.status === 429) {
        return {
          success: false,
          posts: [],
          error: "محدودیت تعداد درخواست. لطفاً بعداً تلاش کنید.",
        };
      }

      return {
        success: false,
        posts: [],
        error: "خطا در دریافت اطلاعات کاربر.",
      };
    }

    const userIdData = await userIdResponse.json();
    const userId = userIdData.UserID || userIdData.user_id || userIdData.id;

    if (!userId) {
      console.error("No user_id found in response:", userIdData);
      return {
        success: false,
        posts: [],
        error: "خطا در دریافت شناسه کاربر.",
      };
    }

    console.log(`✅ Got user_id for @${username}:`, userId);

    // Step 2: Get user's posts using user_id
    const feedUrl = `https://${apiHost}/feed?user_id=${userId}`;
    
    const response = await fetch(feedUrl, {
      method: "GET",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": apiHost,
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error(`RapidAPI error getting feed: ${response.status} ${response.statusText}`);
      
      if (response.status === 429) {
        return {
          success: false,
          posts: [],
          error: "محدودیت تعداد درخواست. لطفاً بعداً تلاش کنید.",
        };
      }

      return {
        success: false,
        posts: [],
        error: "خطا در دریافت پست‌ها از اینستاگرام.",
      };
    }

    const data = await response.json();

    // Map API response to our interface
    // Instagram API – Fast & Reliable Data Scraper /feed endpoint response
    const posts: InstagramPost[] = [];
    
    // This API returns: { items: [...] }
    const items = data?.items || data?.data?.items || [];

    for (const item of items.slice(0, limit)) {
      try {
        const post: InstagramPost = {
          id: item.id || item.pk || String(Date.now() + Math.random()),
          mediaUrl: item.image_versions2?.candidates?.[0]?.url || 
                    item.thumbnail_url ||
                    item.display_url ||
                    "",
          caption: item.caption?.text || "",
          mediaType: item.media_type === 2 ? "VIDEO" : 
                     item.media_type === 8 ? "CAROUSEL_ALBUM" : 
                     "IMAGE",
          timestamp: item.taken_at 
            ? new Date(item.taken_at * 1000).toISOString()
            : new Date().toISOString(),
          permalink: item.code 
            ? `https://instagram.com/p/${item.code}`
            : `https://instagram.com/${username}`,
          thumbnailUrl: item.thumbnail_url || 
                        item.image_versions2?.candidates?.[0]?.url ||
                        undefined,
        };

        // Only add posts with valid image URLs
        if (post.mediaUrl) {
          posts.push(post);
        }
      } catch (itemError) {
        console.error("Error mapping Instagram post:", itemError);
        // Continue with next item
      }
    }

    if (posts.length === 0) {
      return {
        success: false,
        posts: [],
        error: "پستی یافت نشد یا حساب کاربری خصوصی است.",
      };
    }

    return {
      success: true,
      posts,
    };
  } catch (error) {
    console.error("Error fetching Instagram posts:", error);
    return {
      success: false,
      posts: [],
      error: "خطای شبکه. لطفاً اتصال اینترنت خود را بررسی کنید.",
    };
  }
}
