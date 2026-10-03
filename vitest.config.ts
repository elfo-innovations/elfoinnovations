import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Mirrors the "@" -> src alias that @lovable.dev/vite-tanstack-config provides for the
  // app build (see vite.config.ts), so tests can import app components (e.g. src/components/ui/*)
  // that use "@/..." imports without duplicating the app's full Vite plugin stack here.
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
