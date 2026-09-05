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