# Reviews System Setup Guide

This guide will help you set up the reviews system with database, API routes, and Cloudinary integration.

## 1. Database Setup

### Run the SQL Schema

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `lib/supabase/reviews-schema.sql`
4. Click **Run** to execute the SQL

This will create:
- `reviews` table - stores customer reviews
- `review_comments` table - stores comments on reviews
- Indexes for performance
- RLS policies for security
- Triggers to auto-update product ratings

## 2. Environment Variables

Ensure these environment variables are set in your `.env.local` file:

```env
# Supabase (should already be configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudinary (should already be configured)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

## 3. API Routes Created

The following API routes have been set up:

### GET `/api/reviews`
Fetch paginated list of approved reviews
- Query params: `page`, `limit`, `product_id`, `featured`
- Returns: `{ reviews, total, page, totalPages }`

### POST `/api/reviews`
Create a new review (admin only)
- Requires authentication
- Body: `customer_name`, `location`, `rating`, `comment`, `product_name`, etc.

### GET `/api/reviews/[id]`
Fetch a single review by ID
- Returns: review object with comments

### PUT `/api/reviews/[id]`
Update a review (admin only)
- Requires authentication
- Body: any fields to update

### DELETE `/api/reviews/[id]`
Delete a review (admin only)
- Requires authentication

### GET `/api/reviews/[id]/comments`
Fetch comments for a review

### POST `/api/reviews/[id]/comments`
Add a comment to a review (public)

## 4. Cloudinary Integration

The system supports Cloudinary uploads for review media (images and videos).

### Upload Flow

1. **Client-side upload** (for images):
   - Uses `uploadToCloudinary()` from `lib/cloudinary/index.ts`
   - Direct upload to Cloudinary with upload preset

2. **Server-side upload** (for videos):
   - Uses `/api/upload/video` route
   - Handles FFmpeg conversion server-side
   - Applies HLS streaming transforms

### Media Storage Format

Media is stored as JSONB in the `reviews` table:

```json
[
  {
    "type": "image",
    "url": "https://res.cloudinary.com/..."
  },
  {
    "type": "video",
    "url": "https://res.cloudinary.com/...",
    "thumbnail": "https://res.cloudinary.com/..."
  }
]
```

## 5. Removing Hardcoded Data

The old hardcoded data in `components/sections/reviews-data.ts` is now only used as:
- **Fallback data** when database is empty
- **Type definitions** for TypeScript
- **Sample data** for development

### To Use Real Data:

1. **Add reviews via Admin Panel** (recommended):
   - Create an admin interface to add/edit reviews
   - Upload images/videos via Cloudinary
   - Reviews are stored in database

2. **Or import existing data**:
   - Use the Supabase dashboard to insert data
   - Or create a migration script

### Current Fallback Behavior:

If the API returns no reviews, the system will:
- Show loading skeleton
- Display "No reviews yet" message
- NOT show hardcoded sample data (you can enable this if needed)

## 6. Admin Features

### Creating Reviews Programmatically

```typescript
const response = await fetch('/api/reviews', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    customer_name: "John Doe",
    customer_avatar: "https://...",
    location: "Lagos, Nigeria",
    rating: 5,
    comment: "Amazing product!",
    product_name: "HD Lace Wig",
    product_id: "uuid-here",
    product_image: "https://...",
    media: [
      {
        type: "image",
        url: "https://res.cloudinary.com/..."
      }
    ],
    is_approved: true,
    is_featured: false
  })
})
```

### Uploading Media

```typescript
import { uploadToCloudinary, uploadViaServer } from '@/lib/cloudinary'

// For images
const imageUrl = await uploadToCloudinary(imageFile)

// For videos
const videoUrl = await uploadViaServer(videoFile)
```

## 7. Frontend Changes

### Reviews List Page (`app/reviews/page.tsx`)
- ✅ Fetches reviews from `/api/reviews`
- ✅ Shows loading skeleton
- ✅ Pagination support
- ✅ No hardcoded data

### Review Detail Page (`app/reviews/[id]/page.tsx`)
- ✅ Fetches single review from `/api/reviews/[id]`
- ✅ Loads comments from API
- ✅ Posts comments to `/api/reviews/[id]/comments`
- ✅ Loading state
- ✅ No hardcoded data

## 8. Testing

### Test the Setup:

1. **Check database connection**:
   ```bash
   npm run dev
   # Visit /reviews - should show loading then empty state
   ```

2. **Add a test review** via Supabase dashboard:
   ```sql
   INSERT INTO reviews (customer_name, location, rating, comment, product_name, media, is_approved)
   VALUES (
     'Test Customer',
     'Lagos, Nigeria',
     5,
     'Great product!',
     'HD Lace Wig',
     '[{"type": "image", "url": "https://res.cloudinary.com/deafv5ovi/image/upload/f_auto,q_auto/v1785654580/c1_4_wxzhwv.jpg"}]',
     true
   );
   ```

3. **Verify it appears**:
   - Visit `/reviews`
   - Should see the test review

## 9. Next Steps

### Create Admin Panel

Create an admin interface at `/admin/reviews` to:
- View all reviews
- Add new reviews with Cloudinary upload
- Edit existing reviews
- Delete reviews
- Approve/unapprove reviews
- Feature/unfeature reviews

### Example Admin Component Structure:

```
app/admin/reviews/
  ├── page.tsx (list all reviews)
  ├── new/
  │   └── page.tsx (create review)
  └── [id]/
      └── page.tsx (edit review)
```

### Add Review Form Features:

- Customer name input
- Location input
- Rating selector (1-5 stars)
- Comment textarea
- Product selector (from products table)
- Image upload (multiple) with preview
- Video upload with preview
- Cloudinary upload integration

## 10. Database Migrations

If you need to modify the schema later:

1. Create a new migration file in `lib/supabase/migrations/`
2. Name it: `YYYYMMDD_description.sql`
3. Apply via Supabase SQL Editor

Example migration:
```sql
-- Add email field to reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Create index
CREATE INDEX IF NOT EXISTS idx_reviews_customer_email ON reviews(customer_email);
```

## 11. Security Notes

- **RLS Policies**: Public can only view approved reviews
- **Admin Only**: Only authenticated admins can create/update/delete reviews
- **Comments**: Anyone can post comments (you may want to add moderation)
- **API Keys**: Never expose Cloudinary API secret in client code
- **Upload Preset**: Use unsigned upload preset for client-side uploads

## 12. Performance Optimization

### Already Implemented:
- ✅ Database indexes on frequently queried fields
- ✅ Pagination (12 reviews per page)
- ✅ Cloudinary CDN for media
- ✅ Optimized image/video transforms
- ✅ Lazy loading for images

### Additional Optimizations:
- Add Redis caching for popular reviews
- Implement infinite scroll instead of pagination
- Add image lazy loading with blur placeholder
- Use Cloudinary's automatic format (f_auto) and quality (q_auto)

## Troubleshooting

### Reviews not showing?
1. Check browser console for errors
2. Verify Supabase connection
3. Check if reviews have `is_approved = true`
4. Verify RLS policies are correct

### Images not loading?
1. Check Cloudinary URLs are correct
2. Verify upload preset is configured
3. Check CORS settings in Cloudinary

### Comments not posting?
1. Check API route is accessible
2. Verify review ID exists
3. Check database constraints

## Support

For issues or questions:
- Check Supabase logs in dashboard
- Check browser console for client errors
- Review API route logs
- Verify environment variables are set