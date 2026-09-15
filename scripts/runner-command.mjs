import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const registry = JSON.parse(readFileSync(join(root, ".runner", "command-registry.json"), "utf8"));
const input = process.argv.slice(2).join(" ").trim();
if (!input) {
  console.error("Usage: node scripts/runner-command.mjs <natural-language command>");
  process.exit(1);
}
const normalized = input.toLowerCase();
const matches = registry.commands.flatMap((entry) => entry.aliases.filter((alias) => normalized.includes(alias.toLowerCase())).map((alias) => ({ entry, alias })));
const match = matches.sort((left, right) => right.alias.length - left.alias.length)[0]?.entry;
if (!match) {
  console.log(JSON.stringify({ input, status: "unresolved", next: "Use RUNNER STATUS or RUNNER QA to inspect current capabilities." }));
  process.exit(2);
}
console.log(JSON.stringify({ input, canonical: `RUNNER ${match.command}`, agent: match.agent, prompt: `.github/prompts/${match.prompt}`, status: "routed" }));
