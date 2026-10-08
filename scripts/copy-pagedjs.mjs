// Copies Paged.js into public/ so the preview iframe and built app load it
// without relying on package-exports deep imports (pagedjs uses a
// conditions-only exports map).
import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const src = path.join(root, "node_modules", "pagedjs", "dist", "paged.polyfill.js");
const destDir = path.join(root, "public");
const dest = path.join(destDir, "paged.polyfill.js");

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log(`copied ${path.relative(root, src)} → ${path.relative(root, dest)}`);
