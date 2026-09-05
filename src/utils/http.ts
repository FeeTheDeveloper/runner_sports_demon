export async function fetchJson<T>(url: URL, options: RequestInit = {}, retries = 2): Promise<{ data: T; receivedAt: string; latencyMs: number }> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const started = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal, headers: { "user-agent": "runner-live-market-scout/0.1", ...(options.headers ?? {}) } });
      const text = await response.text();
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 500)}`);
      return { data: JSON.parse(text) as T, receivedAt: new Date().toISOString(), latencyMs: Date.now() - started };
    } catch (error) {
      lastError = error;
      if (attempt < retries) await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
