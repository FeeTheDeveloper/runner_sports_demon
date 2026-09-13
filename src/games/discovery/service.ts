import type { CfbGame } from "../types.js";
import { EspnCfbScheduleClient } from "./espn.js";

export class CfbScheduleService {
  private readonly client: EspnCfbScheduleClient;
  private readonly cache = new Map<string, CfbGame[]>();

  constructor(client = new EspnCfbScheduleClient()) { this.client = client; }

  async schedule(date: string): Promise<CfbGame[]> {
    const games = await this.client.fetch(date);
    this.cache.set(date, games);
    return games;
  }

  async today(date = new Date().toISOString().slice(0, 10)): Promise<CfbGame[]> { return this.schedule(date); }

  cached(date: string): CfbGame[] { return this.cache.get(date) ?? []; }

  find(runnerEventId: string): CfbGame | undefined {
    return [...this.cache.values()].flat().find((game) => game.runnerEventId === runnerEventId);
  }
}