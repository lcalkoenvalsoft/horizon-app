/** @type {import('next').NextConfig} */
const nextConfig = {
  // For web deployment on Vercel, use 'standalone'
  // For mobile builds with Capacitor, change to 'export'
  output: process.env.BUILD_TARGET === "mobile" ? "export" : "standalone",
  reactStrictMode: true,
  images: { unoptimized: true },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
