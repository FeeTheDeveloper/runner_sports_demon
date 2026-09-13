import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const contractsDir = join(root, "contracts");
const requiredContracts = ["runner-event.schema.json", "verse-export.schema.json", "model-manifest.schema.json", "feature-manifest.schema.json", "live-observation.schema.json", "game-flow.schema.json", "market-snapshot.schema.json", "model-output.schema.json", "site-publish.schema.json", "postgame-result.schema.json"];
const failures = [];
for (const file of requiredContracts) {
  const path = join(contractsDir, file);
  if (!existsSync(path)) { failures.push(`${file}: missing`); continue; }
  try {
    const schema = JSON.parse(readFileSync(path, "utf8"));
    if (typeof schema.$id !== "string" || !schema.$id.endsWith(".v1")) failures.push(`${file}: missing versioned $id`);
    if (schema.type !== "object") failures.push(`${file}: root must be an object schema`);
  } catch (error) { failures.push(`${file}: invalid JSON (${error instanceof Error ? error.message : String(error)})`); }
}
const handoffDir = join(root, ".runner", "handoffs");
for (const file of readdirSync(handoffDir).filter((name) => name.endsWith(".json"))) {
  try {
    const handoff = JSON.parse(readFileSync(join(handoffDir, file), "utf8"));
    if (!handoff.handoff_id || !handoff.from_agent || !handoff.to_agent || !handoff.status) failures.push(`${file}: incomplete handoff`);
  } catch (error) { failures.push(`${file}: invalid JSON (${error instanceof Error ? error.message : String(error)})`); }
}
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log(`Validated ${requiredContracts.length} contracts and ${readdirSync(handoffDir).filter((name) => name.endsWith(".json")).length} handoffs.`);
