import { readFileSync } from "node:fs";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";

type PackageJson = {
  version?: string;
};

const packageJson = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as PackageJson;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const webRelease = env.VITE_SENTRY_RELEASE || env.SENTRY_RELEASE || `belezafoco-web@${packageJson.version ?? "1.0.0"}`;
  const sentryBuildEnabled = Boolean(env.SENTRY_AUTH_TOKEN && env.SENTRY_ORG && env.SENTRY_PROJECT_WEB);

  return {
    build: {
      sourcemap: sentryBuildEnabled ? "hidden" : false
    },
    define: {
      __BELEZAFOCO_WEB_RELEASE__: JSON.stringify(webRelease)
    },
    plugins: [
      react(),
      ...(sentryBuildEnabled
        ? [
            sentryVitePlugin({
              authToken: env.SENTRY_AUTH_TOKEN,
              org: env.SENTRY_ORG,
              project: env.SENTRY_PROJECT_WEB,
              release: {
                name: webRelease
              },
              sourcemaps: {
                filesToDeleteAfterUpload: ["./dist/**/*.map"]
              }
            })
          ]
        : [])
    ]
  };
});
