import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mgp/shared"],
  reactStrictMode: false,
};

export default nextConfig;
