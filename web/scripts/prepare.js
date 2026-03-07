/**
 * Run husky only when not on Vercel (no .git in CI, wastes memory/time).
 * Use: "prepare": "node scripts/prepare.js"
 */
if (process.env.VERCEL) {
  process.exit(0);
}
const { execSync } = require("child_process");
try {
  execSync("npx husky", { stdio: "inherit" });
} catch {
  process.exit(0);
}
