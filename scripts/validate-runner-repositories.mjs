import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const repositories = [
  ["runner_sports_demon", root],
  ["rsaa_verse", resolve(root, "..", "rsaa_verse")],
  ["runner_sports-site", resolve(root, "..", "runner_sports-site")],
];
const failures = [];
for (const [name, path] of repositories) {
  if (!existsSync(join(path, ".git"))) failures.push(`${name}: git repository not found at ${path}`);
  if (!existsSync(join(path, "package.json"))) console.log(`${name}: package.json not present (non-Node repository or uninitialized)`);
  else console.log(`${name}: present`);
}
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
