import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@cvai/ui", "@cvai/schema"],
};

export default config;
