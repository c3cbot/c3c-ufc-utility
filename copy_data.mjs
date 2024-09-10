import { readFileSync, writeFileSync, cpSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

let currentDir = resolve(fileURLToPath(import.meta.url), "..");

let packageJSON = JSON.parse(readFileSync(resolve(currentDir, "package.json"), { encoding: "utf-8" }));
let manifest = JSON.parse(readFileSync(resolve(currentDir, "src", "manifest.json"), { encoding: "utf-8" }));
manifest.version = packageJSON.version;
delete manifest.$schema;

writeFileSync(resolve(currentDir, "dist", "manifest.json"), JSON.stringify(manifest, null, "\t"));
// writeFileSync(resolve(currentDir, "dist", "index.html"), readFileSync(resolve(currentDir, "index.html"), { encoding: "utf-8" }).replace('src="/src/gui/main.tsx"', 'src="/popup-gui.js"'));
cpSync(resolve(currentDir, "assets"), resolve(currentDir, "dist", "assets"), { recursive: true });
cpSync(resolve(currentDir, "LICENSE"), resolve(currentDir, "dist", "LICENSE"));
