import * as esbuild from "esbuild";

async function main() {
  await esbuild.build({
    entryPoints: ["widget/index.ts"],
    bundle: true,
    minify: process.env.NODE_ENV === "production",
    sourcemap: true,
    format: "iife",
    globalName: "ClippyWeb",
    outfile: "public/clippy.js",
    target: ["es2020"],
    define: {
      "process.env.NODE_ENV": JSON.stringify(
        process.env.NODE_ENV || "development",
      ),
    },
  });

  console.log("✓ widget built → public/clippy.js");
}

main();
