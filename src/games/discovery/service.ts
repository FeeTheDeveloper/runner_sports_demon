import type { CfbGame, FootballGame, NflGame } from "../types.js";
import { EspnCfbScheduleClient, EspnNflScheduleClient } from "./espn.js";

class FootballScheduleService<T extends FootballGame> {
  private readonly cache = new Map<string, T[]>();

  constructor(private readonly client: { fetch(date?: string): Promise<T[]> }) {}

  async schedule(date: string): Promise<T[]> {
    const games = await this.client.fetch(date);
    this.cache.set(date, games);
    return games;
  }

  async today(date = new Date().toISOString().slice(0, 10)): Promise<T[]> { return this.schedule(date); }

  cached(date: string): T[] { return this.cache.get(date) ?? []; }

  find(runnerEventId: string): T | undefined {
    return [...this.cache.values()].flat().find((game) => game.runnerEventId === runnerEventId);
  }
}

export class CfbScheduleService extends FootballScheduleService<CfbGame> {
  constructor(client = new EspnCfbScheduleClient()) { super(client); }
}

export class NflScheduleService extends FootballScheduleService<NflGame> {
  constructor(client = new EspnNflScheduleClient()) { super(client); }
}
