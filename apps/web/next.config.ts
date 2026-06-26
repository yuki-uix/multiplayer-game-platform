import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mgp/shared"],
  reactStrictMode: true,
};

export default nextConfig;
