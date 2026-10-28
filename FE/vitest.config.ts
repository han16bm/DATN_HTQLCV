import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    env: {
      NEXT_PUBLIC_API_BASE_URL: "http://gateway.test/api",
      NEXT_PUBLIC_MSW_DELAY: "0",
    },
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    fileParallelism: false,
  },
});
