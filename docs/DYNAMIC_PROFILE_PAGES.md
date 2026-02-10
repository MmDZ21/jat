# Dynamic Profile Pages - Documentation

## Overview
A beautiful Linktree-style public profile page with dynamic routing. Users can view profiles at `/{username}` with a clean, mobile-first design.

## Files Created

### 1. `/src/app/[username]/page.tsx`
Server Component that:
- Fetches profile and items from database
- Checks if profile is published
- Separates products and services
- Generates SEO metadata
- Returns 404 if profile not found

### 2. `/src/app/[username]/ProfileClient.tsx`
Client Component with:
- Profile header with avatar, name, and bio
- Tab toggle between products and services
- Animated item cards with Framer Motion
- Responsive design
- Vacation mode banner
- Contact information

### 3. `/src/app/[username]/not-found.tsx`
Custom 404 page with Persian text and branding.

## Features

### ✨ Profile Header
- **Avatar** - Shows image or first letter of name
- **Display Name** - Bold, prominent
- **Username** - @username format
- **Bio** - Multi-line with proper spacing
- **Vacation Mode** - Shows banner when active
- **Contact Info** - Email and phone links

### 🔄 Product/Service Toggle
- Clean tab design
- Item count badges
- Smooth transitions
- Active state highlighting

### 🎴 Item Cards
- **Image** - Optional product/service image
- **Name & Price** - Prominent display with Toman
- **Description** - Line-clamped to 2 lines
- **Stock Status** - For products (green dot = available)
- **Digital Badge** - For digital products
- **Duration** - For services (in minutes)
- **Tags** - Shows first 2 tags
- **Hover Effects** - Scale and color transitions

### 🎨 Design Elements
- **Font** - IRANYekan (font-sans)
- **Colors** - Blue primary (#3B82F6), gray backgrounds
- **Shadows** - Subtle, modern shadows
- **Rounded Corners** - Consistent 2xl radius
- **Spacing** - Clean, Apple-like spacing
- **Animations** - Framer Motion for smooth transitions

## Database Query

The page uses Drizzle ORM's relational queries:

```typescript
const profile = await db.query.profiles.findFirst({
  where: and(
    eq(profiles.username, username),
    eq(profiles.isPublished, true)
  ),
  with: {
    items: {
      where: eq(items.isActive, true),
      orderBy: (items, { asc }) => [
        asc(items.sortOrder), 
        asc(items.createdAt)
      ],
    },
  },
});
```

## URL Structure

```
/{username}        → Profile page
/ali              → Example: Ali's profile
/shop_name        → Example: Shop's profile
```

## SEO & Metadata

Each profile generates dynamic metadata:
```typescript
title: "علی رضایی | JAT"
description: "صفحه علی رضایی در JAT"
```

## Example Usage

### 1. Create a Test Profile

First, you need to insert a profile into the database:

```typescript
// Example seed script or SQL
INSERT INTO profiles (
  user_id, 
  username, 
  display_name, 
  bio,
  is_published
) VALUES (
  'user-123',
  'ali_rezaei',
  'علی رضایی',
  'فروشنده محصولات دیجیتال و خدمات طراحی',
  true
);
```

### 2. Add Some Items

```typescript
// Add a product
INSERT INTO items (
  seller_id,
  type,
  name,
  description,
  price,
  stock_quantity,
  is_active
) VALUES (
  'profile-id',
  'product',
  'دوره آموزش برنامه‌نویسی',
  'دوره جامع Next.js از صفر تا صد',
  '500000',
  10,
  true
);

// Add a service
INSERT INTO items (
  seller_id,
  type,
  name,
  description,
  price,
  duration_minutes,
  is_active
) VALUES (
  'profile-id',
  'service',
  'مشاوره کسب‌وکار',
  'یک ساعت مشاوره تخصصی',
  '200000',
  60,
  true
);
```

### 3. Visit the Profile

Navigate to: `http://localhost:3000/ali_rezaei`

## Responsive Breakpoints

- **Mobile**: < 768px (default, mobile-first)
- **Tablet**: 768px+
- **Desktop**: Max width 2xl (672px) for optimal reading

## Color Scheme

```css
Primary: Blue (#3B82F6)
Accent: Purple (#9333EA)
Success: Green (#22C55E)
Warning: Amber (#F59E0B)
Error: Red (#EF4444)

Background: White → Gray gradient
Cards: White with subtle shadows
Text: Gray-900 (primary), Gray-600 (secondary)
```

## Animation Timing

- **Page Load**: 0.5s fade + slide
- **Tab Switch**: 0.3s crossfade
- **Card Hover**: 0.3s scale + shadow
- **Stagger**: 0.05s between cards

## Customization

### Change Accent Color

In `ProfileClient.tsx`, replace `blue-600` with your color:
```tsx
className="bg-purple-600 text-white" // Purple accent
```

### Add Social Links

You can extend the profile header:
```tsx
{profile.socialLinks?.instagram && (
  <a href={profile.socialLinks.instagram}>
    <Instagram className="w-5 h-5" />
  </a>
)}
```

### Modify Card Layout

Change the item card structure in the map function:
```tsx
<motion.div className="grid grid-cols-2 gap-3">
  {/* 2-column grid layout */}
</motion.div>
```

## Performance

- **Server-Side Rendering** - Fast initial load
- **Database Query** - Single query with relations
- **Optimized Images** - Use Next.js Image component
- **Font Optimization** - Local fonts, no external requests
- **Code Splitting** - Client component separated

## Testing

### Test Different States

1. **Empty Profile**: No items
2. **Products Only**: Only products, no services
3. **Services Only**: Only services, no products
4. **Both Types**: Mix of products and services
5. **Vacation Mode**: Set `vacation_mode = true`
6. **Out of Stock**: Set `stock_quantity = 0`

### Test Responsive Design

- Mobile: 375px (iPhone)
- Tablet: 768px (iPad)
- Desktop: 1024px+

## Common Issues

### Profile Not Found
- Check `is_published = true`
- Verify username spelling
- Ensure profile exists in database

### Items Not Showing
- Check `is_active = true`
- Verify `seller_id` matches profile
- Check database relations

### Images Not Loading
- Ensure `image_url` is valid
- Check CORS if using external images
- Use absolute URLs

## Next Steps

1. Add "Order" or "Book" buttons to items
2. Implement shopping cart functionality
3. Add item detail modal/page
4. Integrate payment (Stripe/Zarinpal)
5. Add analytics tracking
6. Implement profile customization (themes, colors)
7. Add profile views counter
8. Implement sharing functionality

## Resources

- [Next.js Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [Framer Motion](https://www.framer.com/motion/)
- [Drizzle Relational Queries](https://orm.drizzle.team/docs/rqb)
