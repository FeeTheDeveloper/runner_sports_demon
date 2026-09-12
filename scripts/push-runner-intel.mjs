import { readFile } from "node:fs/promises";

const file = process.argv[2];
const baseUrl = process.env.RUNNER_DEMON_URL ?? "http://localhost:8787";
if (!file) {
  console.error("Usage: node scripts/push-runner-intel.mjs <intel.json>");
  process.exit(1);
}

const packet = JSON.parse(await readFile(file, "utf8"));
if (!Array.isArray(packet.observations)) throw new Error("intel packet missing observations[]");

for (const [index, item] of packet.observations.entries()) {
  const body = {
    id: `RUNNER_AI:${item.runnerEventId}:${item.observedAt}:${index}`,
    runnerEventId: item.runnerEventId,
    source: "RUNNER_AI",
    observedAt: item.observedAt,
    receivedAt: new Date().toISOString(),
    confidence: item.confidence,
    sport: packet.sport ?? "CFB",
    notes: item.notes
  };
  const response = await fetch(`${baseUrl}/observations`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const result = await response.text();
  if (!response.ok) throw new Error(`${item.runnerEventId}: ${response.status} ${result}`);
  console.log(`${response.status} ${item.runnerEventId}`);
}
