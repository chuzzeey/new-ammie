/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/product-images/**',
      },
    ],
  },
  // Increase body size limit for video uploads to the API route
  experimental: {
    serverActions: {
      bodySizeLimit: "120mb",
    },
  },
}

export default nextConfig