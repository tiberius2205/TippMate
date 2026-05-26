import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions sind in Next.js 15 standardmäßig aktiv
  },
  // Statische JSON-Daten direkt importierbar
  webpack(config) {
    return config;
  },
};

export default nextConfig;
