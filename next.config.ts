import type { NextConfig } from "next";

const DEFAULT_BACKEND_URL = "https://inventory-node-server.onrender.com";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  env: {
    BACKEND_URL:
      process.env.BACKEND_URL ||
      process.env.API_URL ||
      process.env.SERVER_URL ||
      process.env.APP_API_URL ||
      DEFAULT_BACKEND_URL,
    API_URL:
      process.env.BACKEND_URL ||
      process.env.API_URL ||
      process.env.SERVER_URL ||
      process.env.APP_API_URL ||
      DEFAULT_BACKEND_URL,
  },
};

export default nextConfig;
