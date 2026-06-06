import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@fod/ui", "@fod/schema"],
};

export default config;
