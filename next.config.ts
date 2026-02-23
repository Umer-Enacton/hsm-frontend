import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/dzj8ztyiv/**",
      },
      {
        protocol: "https",
        hostname: "**.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
