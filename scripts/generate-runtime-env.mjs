import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const envPath = path.join(cwd, ".env");
const outputPath = path.join(cwd, "runtime-env.js");

function parseEnvFile(content) {
  const result = {};
  const lines = content.split(/\r?\n/g);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

const envData = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
const parsed = parseEnvFile(envData);
const apiKey = parsed.VITE_INTERFAZE_API_KEY ?? "";

const fileContents =
  "// Generated from .env by scripts/generate-runtime-env.mjs\n" +
  "window.CLIPPY_WEB_ENV = Object.assign({}, window.CLIPPY_WEB_ENV || {}, " +
  `${JSON.stringify({ VITE_INTERFAZE_API_KEY: apiKey })});\n`;

fs.writeFileSync(outputPath, fileContents, "utf8");
console.log("Generated runtime-env.js");
