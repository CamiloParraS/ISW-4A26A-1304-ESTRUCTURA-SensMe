import { resolve } from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path/win32";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "music-metadata/lib/core": resolve(
        __dirname,
        "node_modules/music-metadata/lib/core.js",
      ),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
