import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "ClippyWeb",
      formats: ["es", "iife"],
      fileName: (format) => `clippy-web.${format}.js`
    },
    rollupOptions: {
      output: {
        exports: "named"
      }
    },
    sourcemap: true
  }
});
