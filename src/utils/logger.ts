export type LogLevel = "debug" | "info" | "warn" | "error";

export function log(level: LogLevel, message: string, context: Record<string, unknown> = {}) {
  const entry = { ts: new Date().toISOString(), level, message, ...context };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
