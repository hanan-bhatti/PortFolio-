import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "*.ufs.sh" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "media.licdn.com" },
    ],
  },
};

export default nextConfig;
