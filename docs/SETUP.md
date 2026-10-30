# Supabase & Cloudinary Setup Guide

This guide will walk you through setting up Supabase (database) and Cloudinary (image storage) for the admin page.

---

## Prerequisites

- Node.js installed
- A Supabase account (sign up at https://supabase.com)
- A Cloudinary account (sign up at https://cloudinary.com)

---

## Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js
```

This has already been done.

---

## Step 2: Set Up Supabase

### 2.1 Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in:
   - **Project name:** ammie-store
   - **Database password:** (save this securely)
   - **Region:** Choose closest to you
4. Click "Create new project"

### 2.2 Get Your Supabase Credentials

1. In your Supabase project, go to **Settings** (gear icon)
2. Click **API** in the left sidebar
3. Copy these values:
   - **Project URL** (e.g., `https://xyz123.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### 2.3 Run Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy the entire contents of `lib/supabase/full-schema.sql`
4. Paste into the SQL editor
5. Click **Run** (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

If the admin dashboard reports `Could not find the table 'public.products' in the schema cache`,
run `lib/supabase/migrations/20261029_create_products_table.sql` in the same SQL editor,
then refresh the app. This creates the missing products table and reloads the API schema cache.

If Admin → Payments reports `Could not find the table 'public.orders' in the schema cache`,
run this from the repository root to create the orders table and refresh the API schema:

```bash
supabase db query --linked --file lib/supabase/migrations/20261030_create_orders_table.sql
```

This provisions the orders table for admin payment activity. Checkout currently does
not save an order or generate an invoice: until a payment gateway is configured, it
shows a processing state and then returns the customer to the preserved checkout form.
Admins can still review existing orders and mark them cancelled from **Admin → Payments → Order activity**.

This will create:
- `products` table with all necessary fields
- Indexes for performance
- Row Level Security policies
- Sample data (15 products)

### 2.4 Create `.env.local` File

Create a file named `.env.local` in the root of your project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace with your actual values from step 2.2.

---

## Step 3: Set Up Cloudinary

### 3.1 Create a Cloudinary Account

1. Go to https://cloudinary.com and sign up
2. Verify your email

### 3.2 Get Your Cloudinary Credentials

1. In Cloudinary dashboard, go to **Settings** → **Upload**
2. Scroll down to **Upload presets**
3. Note your:
   - **Cloud name** (e.g., `dxabc123`)
   - **API Key**
   - **API Secret**

### 3.3 Create Upload Preset

1. In Cloudinary dashboard, go to **Settings** → **Upload** → **Upload presets**
2. Click **Add upload preset**
3. Configure:
   - **Preset name:** `ammie-store-products`
   - **Signing mode:** Unsigned (for client-side uploads)
   - **Folder:** `ammie-store/products`
   - **Max file size:** 5MB
   - **Allowed formats:** jpg, png, webp
4. Click **Save**

### 3.4 Add Cloudinary to `.env.local`

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_PRESET=ammie-store-products
```

---

## Step 4: Test the Integration

### 4.1 Start Development Server

```bash
npm run dev
```

### 4.2 Test Admin Page

1. Go to http://localhost:3000/admin
2. You should see:
   - Admin header with logout button (no logo)
   - "Admin Dashboard" heading
   - Search input
   - Product grid with 15 sample products

### 4.3 Test CRUD Operations

**Add Product:**
1. Click "Add Product" button
2. Fill in the form
3. Click "Add Product"
4. Should see success alert and product appears in grid

**Edit Product:**
1. Click "Edit" on any product
2. Modify fields
3. Click "Update Product"
4. Should see success alert and product updates

**Delete Product:**
1. Click "Delete" (trash icon) on any product
2. Confirmation modal appears
3. Click "Yes, Delete"
4. Should see success alert and product removed

**Search:**
1. Type in search box
2. (Note: Search is currently UI-only, not functional yet)

---

## Step 5: Enable Admin Authentication (Optional but Recommended)

Currently, anyone can access the admin page. To secure it:

### Option A: Simple Password Protection

Add to `app/admin/page.tsx`:

```typescript
const [isAuthenticated, setIsAuthenticated] = useState(false)
const [password, setPassword] = useState("")

if (!isAuthenticated) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-card p-8 rounded-2xl max-w-md w-full">
        <h1 className="font-serif text-2xl mb-4">Admin Login</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter admin password"
          className="w-full bg-background border border-border rounded-xl px-4 py-3 mb-4"
        />
        <button
          onClick={() => password === "your-secret-password" && setIsAuthenticated(true)}
          className="w-full bg-primary text-primary-foreground py-3 rounded-full"
        >
          Login
        </button>
      </div>
    </div>
  )
}
```

### Option B: Supabase Auth (More Secure)

1. Enable Email auth in Supabase dashboard
2. Create an `admins` table with user IDs
3. Check auth status on admin page
4. Redirect to login if not authenticated

---

## Step 6: Add Image Upload to Cloudinary (Future Enhancement)

Currently, you manually paste Cloudinary URLs. To add upload functionality:

1. Create an API route `app/api/upload/route.ts`
2. Use Cloudinary upload API
3. Return the secure URL
4. Update ImageGallery component to support file upload

---

## Troubleshooting

### "Missing Supabase environment variables"

- Make sure `.env.local` file exists in root directory
- Restart dev server after adding env variables

### "Failed to load products"

- Check Supabase credentials in `.env.local`
- Verify schema was run successfully in Supabase SQL Editor
- Check browser console for detailed error

### "Failed to save product"

- Check Row Level Security policies in Supabase
- Make sure you're authenticated (if RLS requires it)
- Check browser console for detailed error

### Images not showing

- Verify Cloudinary URLs are correct
- Check if images exist in Cloudinary media library
- Make sure Cloudinary URLs are publicly accessible

---

## Next Steps

1. **Implement search functionality** (filter products by name/description)
2. **Add pagination** if you have 100+ products
3. **Add image upload** button to upload directly to Cloudinary
4. **Add loading skeletons** for better UX
5. **Add error boundaries** for better error handling

---

## File Structure

```
ammie-store/
├── .env.local                          # Your credentials (not in git)
├── .env.local.example                  # Example env file
├── lib/
│   ├── supabase.ts                     # Supabase client & types
│   └── supabase/full-schema.sql        # Complete database schema
├── app/admin/
│   ├── page.tsx                        # Admin page with CRUD
│   └── components/
│       ├── types.ts                    # Form types
│       ├── image-gallery.tsx           # Image gallery
│       ├── basic-info-form.tsx         # Name/tagline/description
│       ├── pricing-form.tsx            # Price/original price/sizes
│       ├── rating-form.tsx             # Rating/review count
│       ├── accordion-fields.tsx        # Details/how to use/ingredients/delivery
│       └── product-grid.tsx            # Product display grid
└── docs/
    ├── admin-database-integration.md   # Technical discussion
    └── SETUP.md                        # This file
```

---

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the terminal where dev server is running
3. Verify all environment variables are set correctly
4. Make sure Supabase schema was run successfully
5. Check Supabase logs in the dashboard

---

## Security Notes

- Never commit `.env.local` to git (it's in `.gitignore`)
- Use Row Level Security in Supabase
- Don't expose API secrets in client-side code
- Add admin authentication before deploying to production
- Use HTTPS in production
- Regularly backup your Supabase database