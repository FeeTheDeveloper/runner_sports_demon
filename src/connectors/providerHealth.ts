import type { Provider, ProviderHealth, ProviderHealthStatus } from "../types.js";

export class HealthTracker {
  private state: ProviderHealth;
  constructor(provider: Provider) {
    this.state = { provider, connected: false, status: "DISCONNECTED", reconnectAttempts: 0, eventCount: 0 };
  }
  ok(latencyMs?: number, rateLimit?: { remaining?: number; used?: number }) {
    this.state = { ...this.state, connected: true, status: "CONNECTED", lastMessageAt: new Date().toISOString(), lastError: undefined, latencyMs, rateLimitRemaining: rateLimit?.remaining ?? this.state.rateLimitRemaining, rateLimitUsed: rateLimit?.used ?? this.state.rateLimitUsed, nextRetryAt: undefined, eventCount: this.state.eventCount + 1 };
  }
  error(error: unknown, status: ProviderHealthStatus = "DISCONNECTED", nextRetryAt?: string) {
    this.state = { ...this.state, connected: false, status, lastError: error instanceof Error ? error.message : String(error), nextRetryAt };
  }
  degraded(error: unknown, latencyMs?: number, rateLimit?: { remaining?: number; used?: number }) {
    this.state = { ...this.state, connected: true, status: "DEGRADED", lastMessageAt: new Date().toISOString(), lastError: error instanceof Error ? error.message : String(error), latencyMs, rateLimitRemaining: rateLimit?.remaining ?? this.state.rateLimitRemaining, rateLimitUsed: rateLimit?.used ?? this.state.rateLimitUsed, eventCount: this.state.eventCount + 1 };
  }
  reconnecting(nextRetryAt?: string) {
    this.state = { ...this.state, connected: false, status: "RECONNECTING", nextRetryAt, reconnectAttempts: this.state.reconnectAttempts + 1 };
  }
  disabled(reason: string) {
    this.state = { ...this.state, connected: false, status: "DISABLED", lastError: reason };
  }
  stale(reason: string) {
    this.state = { ...this.state, connected: false, status: "STALE", lastError: reason };
  }
  snapshot(): ProviderHealth { return { ...this.state }; }
}
