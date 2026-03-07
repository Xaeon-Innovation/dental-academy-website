/**
 * Prune unused @next/swc-* platform binaries after npm install to reduce node_modules size.
 * On Vercel keeps only linux-x64-gnu (~112 MB); locally keeps only the current platform.
 * Run as postinstall so it executes after every npm install (including on Vercel).
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const nextDir = path.join(__dirname, "..", "node_modules", "@next");
if (!fs.existsSync(nextDir)) {
  process.exit(0);
}

let entries;
try {
  entries = fs.readdirSync(nextDir, { withFileTypes: true });
} catch {
  process.exit(0);
}

const swcDirs = entries
  .filter((d) => d.isDirectory() && d.name.startsWith("swc-"))
  .map((d) => d.name);

if (swcDirs.length === 0) {
  process.exit(0);
}

function getKeepSet() {
  if (process.env.VERCEL === "1") {
    return new Set(["swc-linux-x64-gnu"]);
  }
  const platform = os.platform();
  const arch = os.arch();
  if (platform === "darwin") {
    return new Set([arch === "arm64" ? "swc-darwin-arm64" : "swc-darwin-x64"]);
  }
  if (platform === "linux") {
    const base = arch === "arm64" ? "swc-linux-arm64" : "swc-linux-x64";
    return new Set([`${base}-gnu`, `${base}-musl`]);
  }
  if (platform === "win32") {
    return new Set([
      arch === "arm64" ? "swc-win32-arm64-msvc" : "swc-win32-x64-msvc",
    ]);
  }
  return new Set(swcDirs);
}

const keep = getKeepSet();
const toRemove = swcDirs.filter((name) => !keep.has(name));
let freedBytes = 0;

for (const name of toRemove) {
  const dirPath = path.join(nextDir, name);
  try {
    const size = getDirSize(dirPath);
    freedBytes += size;
    fs.rmSync(dirPath, { recursive: true });
  } catch (err) {
    console.warn(`prune-swc: could not remove ${name}:`, err.message);
  }
}

if (toRemove.length > 0) {
  const freedMB = (freedBytes / (1024 * 1024)).toFixed(1);
  console.log(
    `prune-swc: removed ${toRemove.length} unused SWC binary/binaries (~${freedMB} MB). Kept: ${[...keep].join(", ")}`
  );
}

function getDirSize(dirPath) {
  let size = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dirPath, e.name);
      size += e.isDirectory() ? getDirSize(full) : fs.statSync(full).size;
    }
  } catch {
    // ignore
  }
  return size;
}
