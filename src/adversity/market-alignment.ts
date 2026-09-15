import { stableHash } from "../utils/hash.js";
import type { AdversityEvent, EventMarketAlignment, SportsbookMarketSnapshot } from "../types.js";

export function alignAdversityEvent(event: AdversityEvent, snapshots: SportsbookMarketSnapshot[]): EventMarketAlignment[] {
  return snapshots
    .filter((snapshot) => snapshot.runnerEventId === event.runnerEventId)
    .map((snapshot) => {
      const direct = event.affectedTeam !== undefined && snapshot.teamId === event.affectedTeam;
      return {
        id: stableHash({ eventId: event.id, marketId: snapshot.marketId, sportsbook: snapshot.sportsbook }),
        adversityEventId: event.id,
        runnerEventId: event.runnerEventId,
        marketId: snapshot.marketId,
        impactClass: direct ? "DIRECT" : "INDIRECT",
        mappingMethod: "CANONICAL_EVENT",
        confidence: direct ? Math.min(event.confidence, 1) : event.confidence * 0.5,
        causality: event.causality,
        createdAt: new Date().toISOString(),
      };
    });
}