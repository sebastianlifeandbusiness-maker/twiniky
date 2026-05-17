import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.amazonaws.com" },
      { protocol: "https", hostname: "twiniky-assets.s3.amazonaws.com" },
    ],
  },
};

export default nextConfig;
