/** Completion-based polling: no overlapping tasks, and stop drains active work. */
export async function startSerialPolling(
  task: () => Promise<void>,
  intervalMs: number,
  onError: (error: unknown) => void,
  signal?: AbortSignal,
): Promise<{ stop: () => Promise<void> }> {
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) throw new Error("poll interval must be positive");
  let stopped = signal?.aborted ?? false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let active: Promise<void> = Promise.resolve();
  const cancel = () => {
    stopped = true;
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  };
  const stop = async () => { cancel(); await active; };
  const schedule = () => {
    if (stopped) return;
    timer = setTimeout(() => {
      active = Promise.resolve().then(task).catch(onError).finally(schedule);
    }, intervalMs);
  };
  signal?.addEventListener("abort", cancel, { once: true });
  if (stopped) { cancel(); return { stop }; }
  active = Promise.resolve().then(task);
  try { await active; } catch (error) { cancel(); throw error; }
  schedule();
  return { stop };
}
