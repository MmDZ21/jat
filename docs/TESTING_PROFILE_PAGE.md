# Testing the Profile Page

## Quick Start

### 1. Install Dependencies (if needed)
```bash
pnpm install
```

### 2. Push Schema to Database
```bash
pnpm db:push
```

### 3. Seed Test Data
```bash
pnpm db:seed
```

This will create:
- ✅ A test profile: `ali_rezaei`
- ✅ 3 products (including one out of stock)
- ✅ 3 services

### 4. Start Development Server
```bash
pnpm dev
```

### 5. Visit the Profile
Open: **http://localhost:3000/ali_rezaei**

## What You'll See

### Profile Header
- Avatar with gradient ring
- Display name: "علی رضایی"
- Username: @ali_rezaei
- Bio text
- Email and phone links

### Products Tab (Default)
1. **دوره آموزش Next.js** - Digital product, 10 in stock
2. **تی‌شرت طرح کد** - Physical product, 25 in stock
3. **پک استیکر برنامه‌نویس** - Out of stock (red indicator)

### Services Tab
1. **مشاوره کسب‌وکار آنلاین** - 60 minutes
2. **طراحی لوگو** - 120 minutes
3. **بررسی کد و رفع باگ** - 90 minutes

## Testing Checklist

- [ ] Profile loads correctly
- [ ] Avatar shows first letter "ع"
- [ ] Both tabs work (محصولات / خدمات)
- [ ] Tab counts show correctly
- [ ] Out of stock indicator appears
- [ ] "محصول دیجیتال" badge shows
- [ ] Duration shows on services
- [ ] Tags display properly
- [ ] Price formatting is correct (with commas)
- [ ] Hover effects work on cards
- [ ] Animations are smooth
- [ ] Mobile responsive
- [ ] RTL layout works

## Customize Test Data

Edit `/src/db/seed.ts` to change:
- Profile information
- Number of products/services
- Prices, descriptions, tags
- Stock quantities
- Vacation mode

Then re-run:
```bash
pnpm db:seed
```

## Test 404 Page

Visit a non-existent username:
**http://localhost:3000/nonexistent_user**

Should show Persian 404 page.

## Test Different States

### Empty Profile
Comment out the items creation in seed.ts

### Vacation Mode
In seed.ts, set:
```typescript
vacationMode: true,
vacationMessage: "تا 15 اسفند در حالت تعطیلات هستیم"
```

### No Bio
Remove the bio field from profile creation

## Mobile Testing

Test on these sizes:
- 375px (iPhone SE)
- 390px (iPhone 12)
- 768px (iPad)
- 1024px (Desktop)

## Performance Testing

Check:
- Page load speed
- Animation smoothness
- Image loading (when added)
- Database query time

## Troubleshooting

### Profile Not Loading
```bash
# Check database connection
pnpm db:push

# Re-seed data
pnpm db:seed
```

### Styling Issues
Clear Next.js cache:
```bash
rm -rf .next
pnpm dev
```

### TypeScript Errors
Restart TypeScript server in your editor

## Next Features to Test

Once implemented:
- [ ] Order/booking buttons
- [ ] Shopping cart
- [ ] Item detail modals
- [ ] Profile customization
- [ ] Social links
- [ ] Custom domains
- [ ] Analytics
