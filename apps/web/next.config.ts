import type { NextConfig } from "next";

const apiOrigin =
  process.env.API_INTERNAL_URL ??
  (process.env.NODE_ENV === "production"
    ? "http://belezafoco-api:3333"
    : "http://localhost:4000");

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1"],
  transpilePackages: ["@belezafoco/ui", "@belezafoco/types", "@belezafoco/sdk"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`
      }
    ];
  }
};

export default nextConfig;
