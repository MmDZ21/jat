import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Allow all HTTPS images for now
      },
    ],
    formats: ["image/avif", "image/webp"], // Modern formats for better performance
  },
};

export default nextConfig;
