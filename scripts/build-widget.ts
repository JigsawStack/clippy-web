import * as esbuild from "esbuild";

const shared: esbuild.BuildOptions = {
  entryPoints: ["widget/index.ts"],
  bundle: true,
  sourcemap: true,
  format: "iife",
  globalName: "ClippyWeb",
  target: ["es2020"],
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development",
    ),
  },
};

async function main() {
  await Promise.all([
    esbuild.build({
      ...shared,
      minify: false,
      outfile: "public/clippy.js",
    }),
    esbuild.build({
      ...shared,
      minify: true,
      outfile: "dist/clippy.min.js",
    }),
    esbuild.build({
      ...shared,
      minify: false,
      outfile: "dist/clippy.js",
    }),
  ]);

  console.log("✓ widget built → public/clippy.js, dist/clippy.js, dist/clippy.min.js");
}

main();
