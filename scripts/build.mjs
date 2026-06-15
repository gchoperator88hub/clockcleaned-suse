import { build } from "esbuild";
import { mkdir, rm, cp } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const distDir = path.join(root, "dist");
const publicDir = path.join(root, "public");

await rm(distDir, { recursive: true, force: true });
await mkdir(path.join(distDir, "assets"), { recursive: true });

// Copy static HTML (will reference ./assets/main.js)
await cp(path.join(publicDir, "index.html"), path.join(distDir, "index.html"));

await build({
  entryPoints: [path.join(root, "src", "main.js")],
  bundle: true,
  minify: true,
  sourcemap: true,
  format: "esm",
  target: ["es2019"],
  outdir: path.join(distDir, "assets"),
  entryNames: "main",
});

await build({
  entryPoints: [path.join(root, "src", "styles.css")],
  bundle: true,
  minify: true,
  sourcemap: true,
  outdir: path.join(distDir, "assets"),
  entryNames: "styles",
  loader: { ".css": "css" },
});

