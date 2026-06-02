import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from bundling native/server-only packages into the build worker.
  // Without this, the "Collecting page data" phase crashes silently.
  serverExternalPackages: ["sharp", "pg", "mysql2"],
};

export default nextConfig;
