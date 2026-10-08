// Library build: compiles src/core (IR + numbering + resolve + envelope +
// layout) into dist-core/core.js so plain-Node scripts (export-pdf.mjs) run
// the SAME pipeline as the app. Zod stays external (already in node_modules).
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "dist-core",
    emptyOutDir: true,
    target: "es2022",
    minify: false,
    lib: {
      entry: fileURLToPath(new URL("./src/core/index.ts", import.meta.url)),
      formats: ["es"],
      fileName: () => "core.js",
    },
    rollupOptions: {
      external: ["zod"],
    },
  },
});
