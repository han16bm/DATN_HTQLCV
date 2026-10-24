import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    env: { NEXT_PUBLIC_API_ORIGIN: "http://gateway.test" },
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    fileParallelism: false,
  },
});
