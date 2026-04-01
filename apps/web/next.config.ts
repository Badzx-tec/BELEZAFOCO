import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const apiOrigin =
  process.env.API_INTERNAL_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://p03--belezafoco-api--fdzfclqyqq99.code.run"
    : "http://localhost:4000");

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1"],
  transpilePackages: ["@belezafoco/ui", "@belezafoco/types", "@belezafoco/sdk"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/v1/:path*`
      }
    ];
  }
};

export default withSentryConfig(nextConfig, {
  silent: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN
  }
});
