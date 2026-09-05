import type { Provider, ProviderHealth } from "../types.js";

export class HealthTracker {
  private state: ProviderHealth;
  constructor(provider: Provider) {
    this.state = { provider, connected: false, reconnectAttempts: 0, eventCount: 0 };
  }
  ok(latencyMs?: number) {
    this.state = { ...this.state, connected: true, lastMessageAt: new Date().toISOString(), lastError: undefined, latencyMs, eventCount: this.state.eventCount + 1 };
  }
  error(error: unknown) {
    this.state = { ...this.state, connected: false, lastError: error instanceof Error ? error.message : String(error) };
  }
  reconnecting() {
    this.state = { ...this.state, connected: false, reconnectAttempts: this.state.reconnectAttempts + 1 };
  }
  snapshot(): ProviderHealth { return { ...this.state }; }
}
