/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  // Add this to explicitly set the port
  devIndicators: {
    buildActivity: false,
  },
  server: {
    port: 3005,
  },
};

export default nextConfig;
