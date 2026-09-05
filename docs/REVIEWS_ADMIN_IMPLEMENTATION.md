# Reviews Admin Implementation

## Overview
The review management system has been fully implemented with the following features:
- ✅ Customer name, country, city fields
- ✅ Product selector (dropdown with existing products)
- ✅ Rating selector (1-5 stars)
- ✅ Review comment textarea
- ✅ Image/video upload to Cloudinary
- ✅ Add/remove media functionality
- ✅ Save to Supabase database
- ✅ Edit existing reviews
- ✅ Pagination

## Files Modified

### 1. `app/admin/reviews/page.tsx`
**Changes:**
- Added product selector dropdown that fetches products from Supabase
- Added Cloudinary image/video upload functionality
- Added remove media functionality (X button on each uploaded image)
- Wired up form submission to save to Supabase
- Added proper TypeScript typing for media uploads
- Integrated product selection with automatic product name/image population

**Key Features:**
- Product dropdown fetches all products from Supabase on page load
- Image upload supports both images and videos (up to 4 media items)
- Upload uses Cloudinary with automatic optimization
- Form validates minimum 1 and maximum 4 media items
- Country search with autocomplete from country-state-city library
- Location automatically combines city and country

### 2. `lib/supabase/reviews-schema-updated.sql` (NEW)
**Purpose:** SQL schema to run in Supabase SQL Editor

**Tables Created:**
- `reviews` - Main reviews table with all required fields
- `review_comments` - Nested comments on reviews

**Key Fields:**
- `customer_name` - Customer's full name
- `location` - Combined city, country
- `rating` - 1-5 star rating
- `comment` - Review text
- `product_name` - Name of product reviewed
- `product_id` - Foreign key to products table
- `product_image` - Product image URL
- `media` - JSONB array of uploaded images/videos
- `is_approved` - Approval status
- `is_featured` - Featured status

**Indexes:**
- Performance indexes on created_at, rating, is_approved, is_featured, product_id
- Full-text search indexes on comment and customer_name

**Triggers:**
- Auto-update `updated_at` timestamp
- Auto-update product review count and rating when reviews change

**RLS Policies:**
- Public can view approved reviews
- Only authenticated admins can insert/update/delete reviews
- Anyone can insert comments

## Setup Instructions

### Step 1: Run SQL Schema in Supabase

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the contents of `lib/supabase/reviews-schema-updated.sql`
6. Click **Run** (or press Ctrl+Enter)

The schema will:
- Create the `reviews` table
- Create the `review_comments` table
- Set up indexes for performance
- Create triggers for auto-updating timestamps and product stats
- Enable Row Level Security (RLS)
- Create RLS policies
- Enable real-time subscriptions

### Step 2: Verify Environment Variables

Ensure these environment variables are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset
```

### Step 3: Test the Implementation

1. Start your development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

2. Navigate to: http://localhost:3000/admin/reviews

3. Click **"Add Review"** button

4. Fill in the form:
   - **Customer Name**: Enter customer name
   - **Country**: Search and select a country
   - **City**: Enter city name
   - **Product**: Select a product from dropdown (auto-fills product name and image)
   - **Rating**: Select 3, 4, or 5 stars
   - **Review Comment**: Enter review text

5. Upload images:
   - Click the "+" icon in any empty slot
   - Select images or videos (up to 4)
   - Images upload to Cloudinary automatically
   - Click "X" to remove any uploaded media

6. Click **"Save Review"**

7. The review will be saved to Supabase and appear in the list

## Product Add/Remove Functionality

### Adding Products
Products are managed separately in the admin dashboard at `/admin`:
- Click **"Add Product"** to create new products
- Products become available in the review modal dropdown automatically

### Removing Products
- Go to `/admin` dashboard
- Find the product in the grid
- Click the delete (trash) icon
- Confirm deletion

**Note:** Deleting a product doesn't delete associated reviews. The `product_id` in reviews is set to NULL when the product is deleted (via `ON DELETE SET NULL`).

## Image Upload Flow

1. User clicks upload slot in review modal
2. File input accepts `image/*,video/*`
3. File is uploaded to Cloudinary via `uploadToCloudinary()`
4. Cloudinary returns optimized URL
5. URL is stored in `reviewPreviewMedia` state
6. On form submit, media array is saved to `media` JSONB field in Supabase

## Database Schema Details

### reviews table
```sql
- id (UUID, Primary Key)
- customer_name (TEXT, Required)
- customer_avatar (TEXT, Optional)
- location (TEXT, Required) - Format: "City, Country"
- rating (INTEGER, Required, 1-5)
- comment (TEXT, Required)
- product_name (TEXT, Required)
- product_id (UUID, Foreign Key to products)
- product_image (TEXT, Optional)
- media (JSONB, Required) - Array of {type, url, thumbnail?}
- likes (INTEGER, Default: 0)
- is_approved (BOOLEAN, Default: true)
- is_featured (BOOLEAN, Default: false)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### review_comments table
```sql
- id (UUID, Primary Key)
- review_id (UUID, Foreign Key to reviews)
- author_name (TEXT, Required)
- author_avatar (TEXT, Optional)
- text (TEXT, Required)
- likes (INTEGER, Default: 0)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## API Endpoints

### GET /api/reviews
- Fetches paginated approved reviews
- Query params: `page`, `limit`, `product_id`, `featured`
- Returns: `{ reviews, total, page, limit, totalPages }`

### POST /api/reviews
- Creates new review (admin only)
- Requires authentication
- Body: All review fields
- Returns: Created review object

### GET /api/reviews/[id]
- Fetches single review with comments
- Returns: Review object with comments array

### PUT /api/reviews/[id]
- Updates existing review (admin only)
- Requires authentication
- Body: Updated review fields
- Returns: Updated review object

### DELETE /api/reviews/[id]
- Deletes review (admin only)
- Requires authentication
- Returns: Success message

## Cloudinary Configuration

### Upload Preset
Create an upload preset in Cloudinary:
1. Go to Cloudinary Console → Settings → Upload
2. Scroll to **Upload presets**
3. Create a new preset:
   - Name: `ammie-store-reviews` (or your preferred name)
   - Signing Mode: **Unsigned**
   - Folder: `ammie-store/reviews`
   - Resource Type: **Auto** (supports both images and videos)
4. Copy the preset name to `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

### Folder Structure
Uploads are organized in Cloudinary:
```
ammie-store/
├── products/          (existing product images)
└── reviews/           (new review media)
    ├── image1.jpg
    ├── video1.mp4
    └── ...
```

## Troubleshooting

### Issue: "Failed to load products" error
**Solution:** Ensure the `products` table exists in Supabase and has data

### Issue: "Failed to upload images" error
**Solution:** 
- Check Cloudinary credentials in `.env.local`
- Verify upload preset is configured as "Unsigned"
- Ensure `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is set

### Issue: "Unauthorized" error when saving review
**Solution:** Ensure you're logged in as admin at `/admin/login`

### Issue: Reviews not showing on public page
**Solution:** Ensure `is_approved = true` in the review data

## Next Steps (Optional Enhancements)

1. **Video Thumbnails**: Auto-generate video thumbnails using Cloudinary transformations
2. **Bulk Upload**: Allow uploading multiple images at once
3. **Image Cropping**: Add image cropping before upload
4. **Drag & Drop**: Implement drag-and-drop file upload
5. **Preview Modal**: Full-screen preview of uploaded media
6. **Review Approval Workflow**: Approve/reject reviews from admin
7. **Featured Reviews**: Highlight featured reviews on homepage
8. **Review Analytics**: Show review statistics and trends

## Support

For issues or questions:
- Check the browser console for error messages
- Check Supabase logs in the dashboard
- Verify Cloudinary upload settings
- Ensure all environment variables are set correctly