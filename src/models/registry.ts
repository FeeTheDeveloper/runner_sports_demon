import { readFileSync } from "node:fs";

export interface ModelRegistration {
  model_name: string;
  model_version: string;
  production_status: string;
  calibration: string;
  validation_period?: string | null;
  validation_report?: string;
}

export function readModelRegistry(): ModelRegistration[] {
  const parsed = JSON.parse(readFileSync(new URL("../../MODEL_REGISTRY.json", import.meta.url), "utf8"));
  if (!Array.isArray(parsed.models)) throw new Error("Invalid model registry");
  return parsed.models;
}

export function canPublishModel(version: string, models: ModelRegistration[]): boolean {
  // A display label is not model acceptance. Promotion requires recorded validation.
  return models.some(model => model.model_version === version && model.production_status === "production"
    && model.calibration === "validated" && Boolean(model.validation_period)
    && model.validation_period !== "pending" && Boolean(model.validation_report));
}
