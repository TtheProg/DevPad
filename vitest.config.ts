import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Tests target the framework-agnostic transform core in src/lib/ (pure functions).
export default defineConfig({
  test: {
    include: ["src/lib/**/*.test.ts"],
    environment: "node",
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      "@lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
      "@components": fileURLToPath(new URL("./src/components", import.meta.url)),
    },
  },
});
