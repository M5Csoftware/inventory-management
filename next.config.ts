import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    BACKEND_URL:
      process.env.BACKEND_URL ||
      process.env.API_URL ||
      process.env.SERVER_URL ||
      process.env.APP_API_URL ||
      "",
    API_URL:
      process.env.BACKEND_URL ||
      process.env.API_URL ||
      process.env.SERVER_URL ||
      process.env.APP_API_URL ||
      "",
  },
};

export default nextConfig;
