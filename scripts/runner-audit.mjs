#!/usr/bin/env node
// Evidence-based repository audit.
//
// Unlike the doc-level sync audit, every check here inspects real files, real
// imports, real git state, or real command execution. Nothing is inferred from
// status documents. Output:
//   .runner/audit/latest.json      structured, machine-readable result
//   .runner/audit/LATEST_AUDIT.md  human-readable rendering of the same data
//
// Usage: node scripts/runner-audit.mjs [--skip-exec] [--strict] [--stdout]
//   --skip-exec  skip build/test/contract execution (static checks only)
//   --strict     exit 1 when any check fails
//   --stdout     also print the JSON report
//
// Secret values are never read into the report: secret checks record file and
// line locations only.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const args = new Set(process.argv.slice(2));
const skipExec = args.has("--skip-exec");
const STATUS_MAX_AGE_HOURS = 24;
const THIN_MODULE_LINES = 5;
const THIN_DOC_BYTES = 200;

const sections = [];
const rel = (path) => relative(root, path).split("\\").join("/");
const read = (path) => readFileSync(join(root, path), "utf8");
const readJson = (path) => JSON.parse(read(path));
const exists = (path) => existsSync(join(root, path));

function section(id, title) {
  const s = { id, title, checks: [] };
  sections.push(s);
  return (status, name, detail, evidence) => s.checks.push({ status, name, detail, ...(evidence === undefined ? {} : { evidence }) });
}

function run(command, commandArgs, options = {}) {
  const started = Date.now();
  const result = spawnSync(command, commandArgs, { cwd: root, encoding: "utf8", timeout: options.timeout ?? 300_000, env: { ...process.env, ...options.env } });
  // Report paths relative to the workspace so the committed report carries no machine-specific paths.
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().split(dirname(root)).join("..");
  const lines = output.split(/\r?\n/);
  const errorLine = lines.find((line) => /^\w*Error:/.test(line));
  return { ok: result.status === 0 && !result.error, code: result.status, error: result.error?.message, ms: Date.now() - started, tail: result.status === 0 || !errorLine ? lines.slice(-6).join("\n") : errorLine };
}

function walk(dir, filter) {
  const abs = join(root, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path, filter);
    return filter(path) ? [path.split("\\").join("/")] : [];
  });
}

function git(...gitArgs) {
  const result = spawnSync("git", gitArgs, { cwd: root, encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : undefined;
}

// ---------------------------------------------------------------- git anchor
const head = git("rev-parse", "HEAD");
const headTime = git("log", "-1", "--format=%cI");
const branch = git("rev-parse", "--abbrev-ref", "HEAD");
const dirty = (git("status", "--porcelain") ?? "").split("\n").filter(Boolean).length;

// ------------------------------------------------- 1. referenced files exist
{
  const check = section("references", "Referenced files exist and have content");
  const refs = new Map();
  const add = (path, source) => {
    if (!refs.has(path)) refs.set(path, new Set());
    refs.get(path).add(source);
  };

  const manifest = readJson(".runner/sync-manifest.json");
  for (const path of manifest.required_reading ?? []) add(path, "sync-manifest.required_reading");
  if (manifest.audit?.human_report) add(manifest.audit.human_report, "sync-manifest.audit");
  for (const key of ["policy", "human_contract", "handoff"]) {
    const path = manifest.enterprise_resource_control?.[key];
    if (path) add(path, `sync-manifest.enterprise_resource_control.${key}`);
  }

  const registry = readJson(".runner/command-registry.json");
  for (const entry of registry.commands) {
    add(`.github/prompts/${entry.prompt}`, `command-registry:${entry.command}`);
    add(`.github/agents/${entry.agent}.agent.md`, `command-registry:${entry.command}`);
  }

  for (const file of readdirSync(join(root, ".runner/work")).filter((name) => name.endsWith(".json"))) {
    const claim = readJson(`.runner/work/${file}`);
    for (const path of claim.paths ?? []) add(path, `work-claim:${file}`);
  }

  // Backtick-quoted repo paths in top-level docs. Paths rooted in another
  // repository's layout (app/, lib/, runner_sports-site/) are cross-repo and
  // cannot be verified from here.
  const localPrefixes = ["src/", "scripts/", "contracts/", "config/", ".runner/", ".github/", ".vscode/", "research/"];
  for (const doc of readdirSync(root).filter((name) => name.endsWith(".md"))) {
    for (const match of read(doc).matchAll(/`([A-Za-z0-9_.\/-]+\.(?:md|json|ts|mjs|ps1|py|sql|yml))`/g)) {
      const path = match[1];
      if (localPrefixes.some((prefix) => path.startsWith(prefix)) || (!path.includes("/") && path === path.toUpperCase().replace(/\.(MD|JSON)$/, (ext) => ext.toLowerCase()))) add(path, `doc:${doc}`);
    }
  }

  let missing = 0;
  let thin = 0;
  for (const [path, sources] of [...refs].sort(([a], [b]) => a.localeCompare(b))) {
    const from = [...sources].sort();
    if (!exists(path)) {
      missing++;
      check("fail", path, "referenced but missing", from);
      continue;
    }
    const stat = statSync(join(root, path));
    if (stat.isFile() && stat.size < THIN_DOC_BYTES) {
      thin++;
      check("warn", path, `exists but only ${stat.size} bytes`, from);
    }
  }
  check(missing ? "fail" : "pass", "summary", `${refs.size} referenced paths, ${missing} missing, ${thin} thin`);
}

// --------------------------------------- 2. handoff artifacts actually exist
{
  const check = section("handoffs", "Handoff artifacts exist on disk");
  for (const file of readdirSync(join(root, ".runner/handoffs")).filter((name) => name.endsWith(".json")).sort()) {
    const handoff = readJson(`.runner/handoffs/${file}`);
    const artifacts = handoff.artifacts ?? [];
    const claimsDone = ["ready", "complete"].includes(handoff.status) || handoff.validation?.status === "passed";
    if (!artifacts.length) {
      check(claimsDone ? "warn" : "pass", handoff.handoff_id, `status=${handoff.status}, no artifacts listed`);
      continue;
    }
    const results = artifacts.map((artifact) => {
      const abs = resolve(root, artifact);
      const insideRepo = abs.startsWith(root);
      if (existsSync(abs)) return { artifact, state: "present" };
      if (!insideRepo) {
        const repoDir = resolve(root, artifact.split("/").slice(0, 2).join("/"));
        return { artifact, state: existsSync(repoDir) ? "missing" : "unverifiable_repo_absent" };
      }
      return { artifact, state: "missing" };
    });
    const missing = results.filter((result) => result.state === "missing").length;
    const unverifiable = results.filter((result) => result.state === "unverifiable_repo_absent").length;
    const status = missing ? (claimsDone ? "fail" : "warn") : unverifiable ? "unverifiable" : "pass";
    check(status, handoff.handoff_id, `status=${handoff.status}, validation=${handoff.validation?.status ?? "none"}; ${artifacts.length - missing - unverifiable} present, ${missing} missing, ${unverifiable} unverifiable`, results);
  }
}

// ------------------------------------------- 3. source modules are real code
{
  const check = section("source", "Source modules are wired, non-trivial, and tested");
  const files = walk("src", (path) => path.endsWith(".ts"));
  const imports = new Map();
  for (const file of files) {
    const text = read(file);
    const targets = [...text.matchAll(/(?:from\s+|import\s*\(\s*)["'](\.{1,2}\/[^"']+)["']/g)].map((match) => rel(resolve(root, dirname(file), match[1].replace(/\.js$/, ".ts"))));
    imports.set(file, targets.filter((target) => files.includes(target)));
  }

  const reach = (entries) => {
    const seen = new Set();
    const stack = [...entries];
    while (stack.length) {
      const file = stack.pop();
      if (seen.has(file)) continue;
      seen.add(file);
      stack.push(...(imports.get(file) ?? []));
    }
    return seen;
  };

  const testFiles = files.filter((file) => file.startsWith("src/tests/") && file.endsWith(".test.ts"));
  const runtime = reach(["src/cli.ts"]);
  const tested = reach(testFiles);
  const productionFiles = files.filter((file) => !file.startsWith("src/tests/") && file !== "src/cli.ts");

  const orphans = productionFiles.filter((file) => !runtime.has(file));
  const untested = productionFiles.filter((file) => !tested.has(file));
  const stubPattern = /throw new Error\(\s*["'`](?:not implemented|todo|unimplemented)/i;
  const thin = [];
  const stubs = [];
  for (const file of productionFiles) {
    const text = read(file);
    const codeLines = text.split(/\r?\n/).filter((line) => line.trim() && !/^\s*(\/\/|\*|\/\*)/.test(line)).length;
    if (codeLines < THIN_MODULE_LINES) thin.push(`${file} (${codeLines} lines)`);
    if (stubPattern.test(text) || /\b(TODO|FIXME)\b/.test(text)) stubs.push(file);
  }

  check("info", "inventory", `${productionFiles.length + 1} production modules, ${testFiles.length} test files, ${files.reduce((sum, file) => sum + read(file).split("\n").length, 0)} total lines`);
  check(orphans.length ? "warn" : "pass", "not reachable from src/cli.ts", `${orphans.length} module(s) are compiled but never loaded by the runtime entry point`, orphans);
  check(untested.length ? "warn" : "pass", "not imported by any test", `${untested.length} module(s) have no test path`, untested);
  check(thin.length ? "warn" : "pass", "thin modules", `${thin.length} module(s) under ${THIN_MODULE_LINES} code lines`, thin);
  check(stubs.length ? "warn" : "pass", "stub markers", `${stubs.length} module(s) contain TODO/FIXME/not-implemented`, stubs);

  // A test file that exists but is not in run-all never executes in CI.
  const runAll = read("src/tests/run-all.ts");
  const suites = JSON.parse(runAll.match(/suites\s*=\s*(\[[^\]]*\])/)?.[1] ?? "[]");
  const unregistered = testFiles.map((file) => file.replace(/^src\/tests\/|\.test\.ts$/g, "")).filter((name) => !suites.includes(name));
  const phantom = suites.filter((name) => !exists(`src/tests/${name}.test.ts`));
  check(unregistered.length ? "fail" : "pass", "test files registered in run-all", `${unregistered.length} test file(s) never executed`, unregistered);
  check(phantom.length ? "fail" : "pass", "run-all suites exist", `${phantom.length} registered suite(s) have no file`, phantom);
}

// ---------------------------------------------- 4. environment contract sync
{
  const check = section("environment", "Environment variables used in code match .env.example");
  const declared = new Set(read(".env.example").split(/\r?\n/).map((line) => line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=/)?.[1]).filter(Boolean));
  const used = new Map();
  for (const file of [...walk("src", (path) => path.endsWith(".ts") && !path.startsWith("src/tests/")), ...walk("scripts", (path) => /\.(mjs|js)$/.test(path))]) {
    const text = read(file);
    const pattern = /process\.env\.([A-Z][A-Z0-9_]*)|process\.env\[\s*["']([A-Z][A-Z0-9_]*)["']\s*\]|(?:int|bool|optionalString|string)Env\(\s*["']([A-Z][A-Z0-9_]*)["']/g;
    for (const match of text.matchAll(pattern)) {
      const name = match[1] ?? match[2] ?? match[3];
      if (!used.has(name)) used.set(name, new Set());
      used.get(name).add(file);
    }
  }
  const undeclared = [...used.keys()].filter((name) => !declared.has(name)).sort();
  const unused = [...declared].filter((name) => !used.has(name)).sort();
  check(undeclared.length ? "fail" : "pass", "used but not declared", `${undeclared.length} variable(s) read by code are missing from .env.example`, undeclared.map((name) => `${name} <- ${[...used.get(name)].join(", ")}`));
  check(unused.length ? "warn" : "pass", "declared but never read", `${unused.length} variable(s) in .env.example are not read by src/ or scripts/`, unused);
  check("info", "summary", `${declared.size} declared, ${used.size} read by code`);
}

// ---------------------------------------------------------- 5. secret hygiene
{
  const check = section("secrets", "No secrets or local env files tracked");
  const tracked = (git("ls-files") ?? "").split("\n").filter(Boolean);
  const envFiles = tracked.filter((file) => /(^|\/)\.env(\.|$)/.test(file) && !file.endsWith(".env.example"));
  check(envFiles.length ? "fail" : "pass", "tracked env files", `${envFiles.length} tracked .env file(s)`, envFiles);

  const patterns = [
    ["private key block", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
    ["JWT-like token", /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/],
    ["Stripe live key", /\b[sr]k_live_[A-Za-z0-9]{10,}/],
    ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{30,}/],
    ["Slack/Discord webhook", /hooks\.slack\.com\/services\/[A-Z0-9]+\/|discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]{20,}/],
  ];
  const hits = [];
  for (const file of tracked.filter((path) => !/\.(png|jpg|jpeg|gif|ico|parquet|duckdb|db)$/i.test(path) && path !== "package-lock.json")) {
    let text;
    try { text = read(file); } catch { continue; }
    text.split(/\r?\n/).forEach((line, index) => {
      for (const [label, pattern] of patterns) if (pattern.test(line)) hits.push(`${file}:${index + 1} (${label})`);
    });
  }
  check(hits.length ? "fail" : "pass", "secret patterns in tracked files", `${hits.length} match(es); values not recorded`, hits);

  const filledSecrets = read(".env.example").split(/\r?\n/).map((line, index) => ({ line, index })).filter(({ line }) => /^\s*[A-Z0-9_]*(KEY|SECRET|TOKEN|WEBHOOK|PASSWORD)[A-Z0-9_]*\s*=\s*\S/.test(line) && !/_(ID|BASE|URL)\s*=/.test(line));
  check(filledSecrets.length ? "fail" : "pass", ".env.example secret slots empty", `${filledSecrets.length} secret-named variable(s) carry a value`, filledSecrets.map(({ index }) => `.env.example:${index + 1}`));
}

// -------------------------------------------- 6. status and model freshness
{
  const check = section("freshness", "Status snapshots and registries match the code they describe");
  const status = readJson(".runner/system-status.json");
  const statusTime = Date.parse(status.updated_at ?? status.generated_at ?? "");
  if (Number.isNaN(statusTime)) check("fail", "system-status timestamp", "no parseable updated_at/generated_at");
  else {
    const ageHours = (Date.now() - statusTime) / 3_600_000;
    const behindHead = headTime && Date.parse(headTime) > statusTime;
    check(ageHours > STATUS_MAX_AGE_HOURS || behindHead ? "fail" : "pass", "system-status age", `updated_at=${status.updated_at}, age=${ageHours.toFixed(1)}h (max ${STATUS_MAX_AGE_HOURS}h), HEAD committed ${headTime}${behindHead ? " — status predates HEAD" : ""}`);
  }
  check(status.git_commit ? (status.git_commit === head ? "pass" : "fail") : "fail", "system-status commit anchor", status.git_commit ? `anchored to ${status.git_commit}` : "no git_commit field; status cannot be tied to code");

  const manifest = readJson(".runner/sync-manifest.json");
  const base = manifest.audit?.base_commit;
  if (!base) check("fail", "sync-manifest base commit", "missing");
  else if (spawnSync("git", ["cat-file", "-e", `${base}^{commit}`], { cwd: root }).status !== 0) check("unverifiable", "sync-manifest base commit", `${base} not in local history (shallow clone?)`);
  else {
    const behind = Number(git("rev-list", "--count", `${base}..HEAD`) ?? "NaN");
    check(behind > 0 ? "warn" : "pass", "sync-manifest base commit", `audited ${base.slice(0, 12)}; HEAD is ${behind} commit(s) ahead`);
  }
  if (manifest.audit?.runtime_execution_verified_by_this_audit === false) check("warn", "sync-manifest execution", "manifest self-reports that its audit did not execute the runtime");

  const placeholders = new Set(["existing", "pending", "tbd", "unknown", ""]);
  for (const model of readJson("MODEL_REGISTRY.json").models) {
    const placeholder = placeholders.has(String(model.model_version).toLowerCase());
    const active = model.production_status === "active";
    check(placeholder ? (active ? "fail" : "warn") : "pass", `model ${model.model_name}`, `version=${model.model_version}, status=${model.production_status}, calibration=${model.calibration}`);
  }
}

// ------------------------------------------ 7. persisted runtime evidence
{
  const check = section("runtime_outputs", "Runtime has produced persisted outputs");
  for (const dir of [".runner/predictions", ".runner/model-runs", ".runner/postgame", ".runner/live-reports", ".runner/research"]) {
    const files = walk(dir, (path) => !path.endsWith(".gitkeep"));
    check(files.length ? "pass" : "warn", dir, files.length ? `${files.length} file(s)` : "empty — no recorded runs in repo");
  }
}

// ------------------------------------------ 8. prerequisites and execution
{
  const check = section("execution", "Toolchain present and build/tests/contracts execute");
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  check(nodeMajor >= 22 ? "pass" : "fail", "node >= 22", `node ${process.versions.node}`);
  const sqlite = spawnSync("sqlite3", ["-version"], { encoding: "utf8" });
  check(sqlite.status === 0 ? "pass" : "fail", "sqlite3 on PATH", sqlite.status === 0 ? sqlite.stdout.trim().split(" ")[0] : "missing — SqliteStore and persistence tests cannot run");
  const python = spawnSync("python3", ["--version"], { encoding: "utf8" });
  check(python.status === 0 ? "pass" : "warn", "python3 (historical ingestion)", python.status === 0 ? python.stdout.trim() : "missing — scripts/ingest_nflverse_pbp.py cannot run");
  check(exists("node_modules") ? "pass" : "fail", "dependencies installed", exists("node_modules") ? "node_modules present" : "run npm ci");

  const ci = exists(".github/workflows/ci.yml") ? read(".github/workflows/ci.yml") : "";
  for (const script of ["build", "test", "contracts:validate", "audit"]) {
    const inCi = new RegExp(`npm (run )?${script.replace(":", "\\:")}\\b`).test(ci) || (script === "test" && /npm test\b/.test(ci));
    check(inCi ? "pass" : "warn", `CI runs npm ${script}`, inCi ? "present in ci.yml" : "not run in CI");
  }

  if (skipExec) check("unverifiable", "execution", "skipped (--skip-exec)");
  else {
    const build = run("npm", ["run", "build"]);
    check(build.ok ? "pass" : "fail", "npm run build", `${build.ms}ms`, build.ok ? undefined : build.tail);
    if (build.ok) {
      const runAll = read("src/tests/run-all.ts");
      const suites = JSON.parse(runAll.match(/suites\s*=\s*(\[[^\]]*\])/)?.[1] ?? "[]");
      for (const suite of suites) {
        const url = new URL(`file://${join(root, "dist/tests", `${suite}.test.js`)}`).href;
        const result = run(process.execPath, ["--input-type=module", "-e", `await import(${JSON.stringify(url)}); process.exit(0);`], { timeout: 120_000 });
        check(result.ok ? "pass" : "fail", `test suite ${suite}`, `${result.ms}ms${result.error ? ` (${result.error})` : ""}`, result.ok ? undefined : result.tail);
      }
    }
    const contracts = run("node", ["scripts/validate-runner-contracts.mjs"]);
    check(contracts.ok ? "pass" : "fail", "contracts:validate", contracts.tail);
    const verse = run("node", ["scripts/validate-verse-export.mjs"]);
    check(verse.ok ? "pass" : "unverifiable", "verse:validate-export", verse.tail);
  }
}

// ------------------------------------------------------------------ report
const counts = { pass: 0, warn: 0, fail: 0, unverifiable: 0, info: 0 };
for (const s of sections) for (const c of s.checks) counts[c.status]++;
const report = {
  schema_version: "runner.audit-report.v1",
  generated_at: new Date().toISOString(),
  git: { commit: head ?? null, branch: branch ?? null, committed_at: headTime ?? null, uncommitted_changes: dirty },
  execution_performed: !skipExec,
  overall: counts.fail ? "fail" : counts.warn || counts.unverifiable ? "partial" : "pass",
  counts,
  sections,
};

const outDir = join(root, ".runner/audit");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "latest.json"), `${JSON.stringify(report, null, 2)}\n`);

const icon = { pass: "PASS", warn: "WARN", fail: "FAIL", unverifiable: "UNVERIFIED", info: "INFO" };
const cell = (value) => String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
const lines = [
  "# Runner Evidence Audit",
  "",
  "Generated by `npm run audit` (`scripts/runner-audit.mjs`). Every row is derived from files on disk, the import graph, git, or command execution — not from status documents. Structured source: `.runner/audit/latest.json`.",
  "",
  `- Generated: ${report.generated_at}`,
  `- Commit: \`${report.git.commit}\` on \`${report.git.branch}\` (committed ${report.git.committed_at}, ${dirty} uncommitted change(s))`,
  `- Execution performed: ${report.execution_performed ? "yes" : "no (--skip-exec)"}`,
  `- Overall: **${report.overall.toUpperCase()}** — ${counts.pass} pass, ${counts.warn} warn, ${counts.fail} fail, ${counts.unverifiable} unverifiable`,
  "",
];
for (const s of sections) {
  lines.push(`## ${s.title}`, "", "| Status | Check | Detail | Evidence |", "| --- | --- | --- | --- |");
  for (const c of s.checks) {
    const evidence = c.evidence === undefined ? "" : Array.isArray(c.evidence) ? c.evidence.map((item) => (typeof item === "string" ? item : `${item.artifact}: ${item.state}`)).join("<br>") : c.evidence;
    lines.push(`| ${icon[c.status]} | ${cell(c.name)} | ${cell(c.detail)} | ${cell(evidence)} |`);
  }
  lines.push("");
}
writeFileSync(join(outDir, "LATEST_AUDIT.md"), `${lines.join("\n")}\n`);

if (args.has("--stdout")) console.log(JSON.stringify(report, null, 2));
console.log(`Runner audit: ${report.overall.toUpperCase()} — ${counts.pass} pass, ${counts.warn} warn, ${counts.fail} fail, ${counts.unverifiable} unverifiable`);
console.log(`Wrote ${rel(join(outDir, "LATEST_AUDIT.md"))} and ${rel(join(outDir, "latest.json"))}`);
if (args.has("--strict") && counts.fail) process.exit(1);
