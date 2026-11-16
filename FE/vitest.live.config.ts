import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    env: {
      NEXT_PUBLIC_API_BASE_URL:
        process.env.LIVE_API_BASE_URL ?? "http://localhost:5000/api",
    },
    environment: "node",
    include: ["tests/live/**/*.probe.ts"],
    testTimeout: 1_800_000,
    fileParallelism: false,
  },
});
