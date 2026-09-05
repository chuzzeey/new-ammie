# Ammie N — Premium Hair & Extensions

Production URL: **https://www.ammien.shop**

A modern, high-performance e-commerce platform for premium wigs, lace fronts, and hair extensions. Built with Next.js 16, React 19, TypeScript, Supabase, and Cloudinary.

---

## Screenshots

### Homepage

> Replace with homepage screenshot

![Homepage](images/homepage.png)

---

### Product Page

> Replace with product page screenshot

![Product Page](images/product-page.png)

---

### Shop Page

> Replace with shop screenshot

![Shop](images/shop.png)

---

### Admin Dashboard

> Replace with admin dashboard screenshot

![Admin Dashboard](images/admin-dashboard.png)

---

### Product Management

> Replace with product management screenshot

![Product Management](images/product-management.png)

---

### Shopping Cart

> Replace with cart screenshot

![Cart](images/cart.png)

---

### Mobile View

> Replace with responsive/mobile screenshot

![Mobile](images/mobile.png)

---

## Features

### Customer Features
- Browse products with real-time search
- Product detail pages with image/video galleries
- Shopping cart with persistent state
- Secure checkout with order tracking
- Invoice generation with WhatsApp vendor integration
- Responsive design for mobile, tablet, and desktop

### Shopping Experience
- Add to cart / Buy Now flows
- Quantity selection and size variants
- Order confirmation with unique access tokens
- Shareable invoice links
- Real-time cart drawer with smooth animations

### Admin Features
- Product CRUD (Create, Read, Update, Delete)
- Bulk media upload (images + videos)
- Real-time product list with search
- Auto-generated product descriptions
- Video-first media ordering enforcement
- ISR revalidation on product updates

### Media Management
- Video upload with Cloudinary HLS transcoding
- Automatic video poster frame generation
- Adaptive bitrate streaming (360p/480p/720p)
- Image optimization with format auto-detection
- Lazy loading and preloading strategies

### Authentication
- Single-admin lockdown — public signup disabled (Supabase toggle + no signup UI)
- Admin login with email/password
- Forgot-password flow with emailed reset link
- Route protection via proxy middleware
- Session persistence across tabs
- Auto-redirect for authenticated/unauthenticated users

> Full setup guide: [`docs/auth-setup.md`](docs/auth-setup.md)

### Search
- Real-time product search in admin dashboard
- Search overlay with blur effect on storefront
- Debounced input handling

### Performance
- Incremental Static Regeneration (ISR)
- Streaming SSR for product pages
- Code-split video player (saves ~40KB initial bundle)
- Dynamic imports for heavy components
- Image optimization via Cloudinary transforms
- Lenis smooth scroll with lazy initialization

### Security
- Server-side route protection
- Environment variable validation
- File size limits on uploads (100MB max)
- Supabase RLS-ready architecture
- CSRF protection via Next.js built-in headers

---

## Architecture

```text
Client
│
├── Homepage
├── Shop
├── Product Details
├── Cart / Checkout
├── Invoice
└── Admin Dashboard
        │
        ▼
Next.js App Router
        │
        ├── Server Components (data fetching, SEO)
        ├── Client Components (interactivity)
        ├── Middleware (auth, session refresh)
        └── API Routes (uploads, revalidation)
                │
                ▼
        Supabase ── Cloudinary
        (Database)   (Media Storage)
```

### Data Flow

```text
User Request
    │
    ▼
Next.js Server Component
    │
    ├── ISR Cache (60s revalidation)
    ├── Supabase Query (server-side)
    └── Stream to Client
            │
            ▼
    Client Component Hydration
            │
            ├── React Query Cache
            ├── Real-time Subscriptions
            └── UI Render
```

---

## Tech Stack

### Frontend
- **Next.js 16** — React framework with App Router, ISR, Streaming, and Server Components
- **React 19** — UI library with concurrent features
- **TypeScript 5** — Type safety across the entire codebase
- **Tailwind CSS 4** — Utility-first CSS with custom design tokens
- **next/font** — Optimized font loading (DM Sans, Playfair Display)

### Backend
- **Next.js API Routes** — Serverless functions for uploads and revalidation
- **Supabase SSR** — Server-side Supabase client for auth and database
- **Next.js Middleware** — Edge runtime for auth guards and session refresh

### Authentication
- **Supabase Auth** — Email/password + email confirmation/password-reset links with session management
- **@supabase/ssr** — SSR-aware auth client for cookie handling

### Database
- **Supabase PostgreSQL** — Primary database for products, orders, and users
- **Real-time subscriptions** — Live updates via Supabase Realtime

### Storage
- **Cloudinary** — Video and image hosting with automatic optimization
- **HLS transcoding** — Adaptive bitrate streaming for videos

### Media
- **hls.js** — HLS playback in the browser
- **Cloudinary transforms** — Automatic format conversion (WebP/AVIF), quality optimization, and video poster generation

### Rendering
- **ISR (Incremental Static Regeneration)** — Static pages with 60s revalidation
- **Streaming SSR** — Progressive page rendering with Suspense
- **Dynamic Imports** — Code splitting for video player and heavy components
- **SSG** — Static generation for public pages at build time

### State Management
- **React Context** — Cart, search blur, theme, query client
- **@tanstack/react-query** — Server state management with caching and background refetching
- **Zustand-style patterns** — Lightweight state for cart and UI toggles

### Styling
- **Tailwind CSS 4** — Utility classes with custom animations
- **tailwind-merge** — Conflict-free class merging
- **class-variance-authority** — Component variant management
- **tw-animate-css** — Animation utilities
- **shadcn/ui** — Accessible component primitives (Radix UI + Tailwind)

### Validation
- **Zod** — Schema validation for forms and API inputs
- **React Hook Form** — Form state management with resolvers

### Deployment
- **Vercel** — Hosting and CI/CD
- **Vercel Analytics** — Privacy-friendly analytics

### Tooling
- **pnpm** — Fast, disk-efficient package manager
- **TypeScript** — Static type checking
- **ESLint** — Code linting
- **Turbopack** — Fast bundler for development and builds

### Developer Experience
- **Hot reload** — Fast refresh during development
- **Path aliases** — `@/*` for clean imports
- **Prettier-ready** — Consistent code formatting
- **Git hooks** — Pre-commit validation (if configured)

---

## Installed Packages

| Package | Purpose | Where Used |
| ------- | ------- | ---------- |
| **next** (16.0.10) | React framework with App Router, ISR, Streaming | Entire app |
| **react** (19.2.0) | UI library | Entire app |
| **react-dom** (19.2.0) | React DOM renderer | Entire app |
| **typescript** (5.x) | Type safety | Entire app |
| **tailwindcss** (4.1.9) | Utility CSS | Entire app |
| **@tailwindcss/postcss** (4.1.9) | Tailwind PostCSS plugin | Build |
| **postcss** (8.5.x) | CSS processing | Build |
| **autoprefixer** (10.4.x) | CSS vendor prefixes | Build |
| **@supabase/supabase-js** (2.110.7) | Supabase client | Database, auth, storage |
| **@supabase/ssr** (0.12.3) | SSR-aware Supabase client | Middleware, server components |
| **@tanstack/react-query** (5.101.3) | Server state management | Product fetching, caching |
| **@tanstack/react-query-devtools** (5.101.3) | React Query devtools | Development |
| **@vercel/analytics** (1.3.1) | Privacy-friendly analytics | Root layout |
| **hls.js** (1.6.16) | HLS video playback | Product page video player |
| **lenis** (1.3.25) | Smooth scroll | Root layout provider |
| **lucide-react** (0.454.0) | Icon library | Entire app |
| **sonner** (1.7.4) | Toast notifications | Admin, cart, forms |
| **react-hook-form** (7.60.0) | Form state management | Admin forms, checkout |
| **@hookform/resolvers** (3.10.0) | Form validation resolvers | Admin forms |
| **zod** (3.25.76) | Schema validation | Forms, API inputs |
| **next-themes** (0.4.6) | Theme provider | Theme switching (if used) |
| **class-variance-authority** (0.7.1) | Component variants | UI components |
| **clsx** (2.1.1) | Conditional class names | Entire app |
| **tailwind-merge** (3.3.1) | Tailwind class merging | UI components |
| **tailwindcss-animate** (1.0.7) | Animation utilities | UI components |
| **tw-animate-css** (1.3.3) | CSS animations | UI components |
| **cmdk** (1.0.4) | Command menu | Search overlay |
| **embla-carousel-react** (8.5.1) | Carousel/slider | Product galleries |
| **react-day-picker** (9.8.0) | Date picker | Invoice page |
| **recharts** (2.15.4) | Chart library | Installed but unused |
| **vaul** (1.1.2) | Drawer component | Cart drawer |
| **html2pdf.js** (0.14.0) | PDF generation | Invoice printing |
| **country-state-city** (3.2.1) | Country/state data | Checkout form |
| **date-fns** (4.1.0) | Date formatting | Invoice page |
| **input-otp** (1.4.1) | OTP input | Not used by current auth flow |
| **react-resizable-panels** (2.1.7) | Resizable panels | Installed but unused |
| **@radix-ui/react-*** (various) | Accessible primitives | UI components (accordion, dialog, dropdown, etc.) |
| **@types/node** (22.x) | Node.js types | TypeScript |
| **@types/react** (19.x) | React types | TypeScript |
| **@types/react-dom** (19.x) | React DOM types | TypeScript |

---

## Project Structure

```
ammie-store/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Homepage
│   ├── globals.css               # Global styles
│   ├── admin/
│   │   ├── page.tsx              # Admin dashboard
│   │   └── login/
│   │       └── page.tsx          # Admin login
│   ├── api/
│   │   ├── revalidate/
│   │   │   └── route.ts          # ISR revalidation endpoint
│   │   └── upload/
│   │       └── video/
│   │           └── route.ts      # Cloudinary upload proxy
│   ├── contact/
│   │   └── page.tsx              # Contact page
│   ├── faq/
│   │   └── page.tsx              # FAQ page
│   ├── invoice/
│   │   └── [id]/
│   │       └── page.tsx          # Order invoice
│   ├── product/
│   │   └── [id]/
│   │       ├── page.tsx          # Product detail (ISR + Streaming)
│   │       └── product-page-client.tsx  # Client component
│   └── shop/
│       └── page.tsx              # Shop listing
│
├── components/
│   ├── providers/                # Context providers
│   │   ├── theme-provider.tsx
│   │   ├── cart-context.tsx      # Shopping cart state
│   │   ├── query-provider.tsx    # React Query wrapper
│   │   ├── lenis-provider.tsx    # Smooth scroll
│   │   └── search-blur-context.tsx  # Search overlay state
│   ├── layout/                   # Structural components
│   │   ├── header.tsx            # Site header
│   │   ├── footer.tsx            # Site footer
│   │   ├── cart-drawer.tsx       # Cart side panel
│   │   ├── search-overlay.tsx    # Search modal
│   │   ├── cta-banner.tsx        # Call-to-action banner
│   │   └── whatsapp-button.tsx   # Floating WhatsApp button
│   ├── sections/                 # Page sections
│   │   ├── hero.tsx              # Hero banner
│   │   ├── feature-section.tsx   # Features grid
│   │   ├── testimonials.tsx      # Customer testimonials
│   │   ├── trust-badges.tsx      # Trust indicators
│   │   └── newsletter.tsx        # Newsletter signup
│   ├── shared/                   # Reusable components
│   │   ├── confirmation-modal.tsx
│   │   └── policy-modal.tsx
│   ├── product/                  # Product-specific
│   │   └── product-grid.tsx      # Featured products grid
│   └── ui/                       # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── drawer.tsx
│       ├── input.tsx
│       ├── sonner.tsx
│       └── ... (40+ components)
│
├── features/
│   └── admin/
│       └── components/           # Admin-specific UI
│           ├── image-gallery.tsx
│           ├── product-grid.tsx
│           ├── product-card.tsx
│           ├── basic-info-form.tsx
│           ├── pricing-form.tsx
│           ├── rating-form.tsx
│           ├── accordion-fields.tsx
│           └── types.ts
│
├── hooks/                        # Custom React hooks
│   ├── use-mobile.ts
│   ├── use-products.ts           # Product fetching with React Query
│   └── use-toast.ts
│
├── lib/                          # Core utilities and services
│   ├── supabase/
│   │   ├── index.ts              # Browser client + types
│   │   ├── server.ts             # Server client
│   │   └── schema.sql            # Database schema
│   ├── cloudinary/
│   │   ├── index.ts              # Core video/image logic
│   │   ├── image-utils.ts        # Image optimization
│   │   └── video-utils.ts        # Video helpers
│   ├── services/
│   │   └── product-descriptions.ts  # Auto-description generation
│   └── utils/
│       └── index.ts              # General utilities
│
├── public/                       # Static assets
│   ├── images/
│   ├── placeholder.svg
│   ├── icon.svg
│   └── ...
│
├── docs/                         # Documentation
│   ├── SETUP.md
│   └── admin-database-integration.md
│
├── .env.local                    # Environment variables (not committed)
├── .gitignore
├── next.config.mjs               # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── postcss.config.mjs            # PostCSS configuration
├── components.json               # shadcn/ui config
├── proxy.ts                      # Next.js middleware
├── package.json
├── pnpm-lock.yaml
└── README.md
```

### Folder Responsibilities

| Folder | Purpose |
|--------|---------|
| `app/` | Next.js App Router pages, layouts, and API routes |
| `components/providers/` | React Context providers for global state |
| `components/layout/` | Structural UI (header, footer, drawers, overlays) |
| `components/sections/` | Reusable page sections (hero, features, testimonials) |
| `components/shared/` | Shared UI components (modals, dialogs) |
| `components/product/` | Product-specific components |
| `components/ui/` | shadcn/ui primitives (Radix + Tailwind) |
| `features/admin/` | Admin dashboard feature (components, types) |
| `hooks/` | Custom React hooks |
| `lib/` | Core business logic, utilities, and external service integrations |
| `public/` | Static assets (images, icons, fonts) |
| `docs/` | Project documentation |

---

## Rendering Strategy

### Server Components (Default)
- **Homepage** (`app/page.tsx`) — Static, server-rendered
- **Product Detail** (`app/product/[id]/page.tsx`) — ISR with 60s revalidation
- **Shop** (`app/shop/page.tsx`) — Static with client-side hydration
- **Admin** (`app/admin/page.tsx`) — Client-side only (requires auth)

### Client Components (`"use client"`)
- **Header** — Cart state, mobile menu, search trigger
- **CartDrawer** — Cart state, checkout flow
- **ProductPageClient** — Image gallery, video player, add to cart
- **Admin Page** — Product CRUD, real-time updates
- **ImageGallery** — File upload, drag-and-drop, preview

### Streaming
- **Product Detail** — Uses `Suspense` to stream the product page client component while showing a skeleton

### Dynamic Routes
- **`/product/[id]`** — Dynamic product pages with ISR
- **`/invoice/[id]`** — Dynamic invoice pages

### Lazy Loading
- **VideoPlayer** — Code-split with `next/dynamic`, loaded only when product has video
- **Heavy components** — Dynamic imports to reduce initial bundle size

### Caching
- **React Query** — Client-side cache with background refetching
- **ISR** — Server-side static cache with 60s revalidation
- **On-demand revalidation** — POST `/api/revalidate` after admin updates
- **Cloudinary CDN** — Global CDN for images and videos

---

## Media Pipeline

### Video Upload Flow

```text
Admin selects video file
    │
    ▼
ImageGallery component
    │
    ▼
POST /api/upload/video (multipart/form-data)
    │
    ▼
Server-side buffer read (max 100MB)
    │
    ▼
Cloudinary unsigned upload (base64 data URI)
    │
    ▼
Cloudinary transcoding:
  - Format normalization (any input → MP4/H.264)
  - HLS master playlist generation (sp_hls)
  - Multiple quality levels (360p, 480p, 720p)
    │
    ▼
Return optimized URL with transforms:
  w_720,q_auto,sp_hls,f_auto
    │
    ▼
Store in Supabase products.images[]
```

### Video Playback Flow

```text
Product page loads
    │
    ▼
Check if images[0] is video URL
    │
    ▼
Generate poster frame:
  - Keep /video/upload/
  - Add so_1.0 (capture at 1s)
  - Add w_600, f_jpg, q_auto
    │
    ▼
Display poster with play icon
    │
    ▼
User clicks play
    │
    ▼
Code-split VideoPlayer loads (hls.js)
    │
    ▼
HLS playback with adaptive bitrate
```

### Image Optimization Flow

```text
Image URL from Supabase
    │
    ▼
getOptimizedProductImage(url, size)
    │
    ▼
Check if video URL → return poster frame
    │
    ▼
Apply Cloudinary transforms:
  - w_150 (thumbnail)
  - w_600 (card)
  - w_1200 (detail)
  - f_auto (WebP/AVIF)
  - q_auto (quality)
    │
    ▼
Return optimized URL
    │
    ▼
Next.js Image component (or direct <img>)
```

---

## Authentication Flow

```text
User visits /admin
    │
    ▼
Middleware (proxy.ts)
    │
    ├── Check Supabase session cookie
    │
    ├── No session → Redirect to /admin/login
    │
    └── Session exists → Continue to /admin
            │
            ▼
    Admin Page (Client Component)
        │
        ├── createClientBrowser() from @lib/supabase
        ├── Auth state listener
        └── Real-time product subscriptions
                │
                ▼
        Admin Login Page
            │
            ├── Email/password (signInWithPassword)
            ├── Signups disabled — owner account provisioned via Admin API (scripts/create-admin.mjs)
            ├── Forgot password at /admin/forgot-password (reset link → /admin/update-password)
            └── Redirect to /admin on success
```

### Session Management
- **Server-side** — Middleware refreshes session on every request
- **Client-side** — `createClientBrowser()` persists session in localStorage
- **Cross-tab** — Supabase auth state syncs across tabs automatically

---

## Database Design

### Tables

#### `products`
| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `name` | TEXT | Product name |
| `price` | INTEGER | Price in Naira (kobo) |
| `images` | TEXT[] | Array of image/video URLs (max 5) |
| `badge` | TEXT | Optional badge (Sale, Bestseller, New) |
| `category` | TEXT | Product category |
| `sizes` | TEXT | Comma-separated sizes |
| `rating` | INTEGER | Average rating (1-5) |
| `review_count` | INTEGER | Number of reviews |
| `description` | TEXT | Product description |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update time |

**Indexes:**
- `id` (primary key)
- `created_at` (for ordering)

**RLS Policies:**
- Public read access for active products
- Admin-only write access (via service role in production)

#### `orders`
| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `customer_name` | TEXT | Customer full name |
| `customer_phone` | TEXT | Phone number |
| `customer_country` | TEXT | Country |
| `customer_state` | TEXT | State/region |
| `customer_address` | TEXT | Delivery address |
| `items` | JSONB | Array of order items |
| `subtotal` | INTEGER | Subtotal in kobo |
| `shipping` | INTEGER | Shipping cost in kobo |
| `total` | INTEGER | Total in kobo |
| `status` | TEXT | Order status (pending, delivered, cancelled) |
| `access_token` | TEXT | Unique token for invoice access |
| `created_at` | TIMESTAMP | Order time |

**Indexes:**
- `id` (primary key)
- `access_token` (for invoice lookup)

### Relationships
- **products** → **orders** (one-to-many via `items` JSONB)
- No foreign keys enforced at DB level (JSONB for flexibility)

---

## API Routes

### `POST /api/upload/video`
**Purpose:** Upload images/videos to Cloudinary

**Authentication:** Admin only (via Supabase auth session)

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `file` (File, max 100MB)

**Response:**
```json
{
  "url": "https://res.cloudinary.com/...",
  "resourceType": "video"
}
```

**Errors:**
- `401 Unauthorized` — Not logged in
- `400 Bad Request` — No file or file too large
- `500 Internal Server Error` — Cloudinary upload failed

---

### `POST /api/revalidate`
**Purpose:** Trigger on-demand ISR revalidation

**Authentication:** Admin only (via Supabase auth session)

**Request:**
```json
{
  "path": "/product/123"
}
```

**Response:**
```json
{
  "revalidated": true
}
```

**Errors:**
- `401 Unauthorized` — Not logged in
- `500 Internal Server Error` — Revalidation failed

---

## Environment Variables

### `.env.example`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset

# App
NEXT_PUBLIC_APP_URL=https://www.ammien.shop
```

### Variable Explanations

| Variable | Purpose | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (public) | Yes |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Cloudinary unsigned upload preset | Yes |
| `NEXT_PUBLIC_APP_URL` | Base URL for absolute links | No |

**Note:** All `NEXT_PUBLIC_*` variables are exposed to the browser. Never store secrets in these variables.

---

## Local Development

### Prerequisites
- Node.js 18+
- pnpm 10+
- Supabase account
- Cloudinary account

### Installation

```bash
# Clone repository
git clone https://github.com/enoch-systems/ammie-store.git
cd ammie-store

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your credentials
```

### Setup

1. **Supabase:**
   - Create a new project
   - Run `lib/supabase/schema.sql` in SQL editor
   - Enable email auth
   - Create an admin user

2. **Cloudinary:**
   - Create an unsigned upload preset
   - Enable video uploads
   - Set max file size to 100MB

3. **Vercel Blob (optional):**
   - Not currently used, but configured for future use

### Commands

```bash
# Development server
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint
```

### Development
- Visit `http://localhost:3000`
- Admin dashboard at `http://localhost:3000/admin`
- Hot reload enabled via Turbopack

---

## Deployment

### Vercel (Recommended)

1. **Connect Repository:**
   - Import project in Vercel dashboard
   - Select `ammie-store` repository

2. **Environment Variables:**
   - Add all variables from `.env.example`
   - Set `NODE_ENV=production`

3. **Build Settings:**
   - Framework: Next.js
   - Build command: `pnpm build`
   - Output directory: `.next`

4. **Deploy:**
   - Vercel automatically deploys on push to `main`
   - Preview deployments for PRs

### Manual Deployment

```bash
# Build
pnpm build

# Start
pnpm start
```

### Post-Deployment
- Verify ISR revalidation works (update a product, check if page updates)
- Test video uploads (Cloudinary preset must be unsigned)
- Check middleware auth guards (`/admin` redirects)

---

## Performance Optimizations

### Next.js Image
- **Cloudinary transforms** — Automatic format conversion (WebP/AVIF) and resizing
- **Lazy loading** — Native `loading="lazy"` for below-fold images
- **Priority loading** — `priority` prop for above-fold images
- **Skeleton placeholders** — Shown while images load

### Cloudinary Transforms
- **Format auto-detection** — `f_auto` serves WebP/AVIF when supported
- **Quality auto-detection** — `q_auto` adjusts quality based on image content
- **Width constraints** — `w_150`, `w_600`, `w_1200` for different contexts
- **Video poster frames** — `so_1.0,w_600,f_jpg` for lightweight thumbnails

### Lazy Loading
- **VideoPlayer** — Code-split with `next/dynamic`, loaded only when needed
- **Product images** — Lazy loaded with skeleton placeholders
- **Sections** — Intersection Observer for scroll-triggered animations

### Dynamic Imports
- **VideoPlayer** — Saves ~40KB from initial bundle
- **Heavy components** — Loaded on-demand

### Bundle Optimization
- **Turbopack** — Fast bundler for dev and build
- **Tree shaking** — Unused code eliminated
- **Code splitting** — Automatic route-based splitting
- **Package deduplication** — pnpm hoists shared dependencies

### Caching
- **React Query** — Client-side cache with stale-while-revalidate
- **ISR** — Server-side static cache with 60s revalidation
- **On-demand revalidation** — Instant updates after admin changes
- **Cloudinary CDN** — Global edge cache for media

### Other Optimizations
- **Lenis smooth scroll** — GPU-accelerated scrolling
- **CSS containment** — `contain` property for layout optimization
- **Font optimization** — `next/font` for zero-layout-shift fonts
- **Analytics** — Privacy-friendly Vercel Analytics (no cookie banner)

---

## Security

### Authentication
- **Supabase Auth** — Industry-standard JWT-based auth
- **Middleware guards** — Server-side route protection
- **Session refresh** — Automatic token refresh via middleware
- **Redirect logic** — Authenticated users redirected from login

### Data Protection
- **Environment variables** — Secrets never committed to git
- **RLS-ready** — Supabase Row Level Security policies in schema
- **Input validation** — Zod schemas for forms and API inputs
- **File size limits** — 100MB max upload size

### Headers
- **CSRF protection** — Next.js built-in CSRF headers
- **X-Frame-Options** — Prevent clickjacking
- **X-Content-Type-Options** — Prevent MIME sniffing
- **Referrer-Policy** — Control referrer information

### API Security
- **Authentication required** — All API routes check Supabase session
- **File type validation** — Only images and videos allowed
- **Base64 encoding** — Safe upload to Cloudinary

---

## Future Improvements

### Short-term
- [ ] Add product reviews and ratings UI
- [ ] Implement wishlist functionality
- [ ] Add more payment gateways (Paystack, Flutterwave)
- [ ] Email notifications for order confirmations
- [ ] Admin analytics dashboard (sales, traffic)
- [ ] Bulk product import/export (CSV)
- [ ] Product variants (color, length)

### Medium-term
- [ ] Multi-language support (i18n)
- [ ] Multi-currency support
- [ ] Advanced search with filters and facets
- [ ] Product recommendations engine
- [ ] Abandoned cart recovery
- [ ] Loyalty program integration
- [ ] SMS notifications

### Long-term
- [ ] Mobile app (React Native)
- [ ] AI-powered product recommendations
- [ ] AR try-on for wigs
- [ ] Live chat support
- [ ] Vendor marketplace (multi-seller)
- [ ] Subscription box service
- [ ] Blockchain-based authenticity verification

---

## License

Proprietary — All rights reserved. This project is confidential and intended for internal use only.

---

## Contact

**Ammie N — Premium Hair & Extensions**

- Website: https://www.ammien.shop
- WhatsApp: +234 903 156 0905

---

