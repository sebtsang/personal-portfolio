import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Ensure the markdown corpus files are bundled into the /api/chat
  // serverless function on Vercel. Without this, fs.readFileSync()
  // at request time would fail to find the files.
  outputFileTracingIncludes: {
    "/api/chat": ["./content/corpus/**/*"],
  },
};

export default nextConfig;
