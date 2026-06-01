import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jkcbjkgwndptyghvixce.supabase.co",
      },
    ],
  },
};

export default nextConfig;
