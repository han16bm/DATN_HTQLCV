import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Kiểm hợp đồng với BE thật (npm run test:live): cần gateway chạy ở LIVE_API_BASE_URL (mặc định http://localhost:5000/api).
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
