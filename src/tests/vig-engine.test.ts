import assert from "node:assert/strict";
import { americanImpliedProbability, calculateVig } from "../models/vig/engine.js";

assert.ok(Math.abs((americanImpliedProbability(-110) ?? 0) - 0.5238095238) < 1e-10);
assert.ok(Math.abs((americanImpliedProbability(150) ?? 0) - 0.4) < 1e-10);
assert.equal(americanImpliedProbability(0), undefined);

const [home, away] = calculateVig([-110, -110]);
assert.ok(Math.abs((home.overround ?? 0) - 0.0476190476) < 1e-10);
assert.ok(Math.abs((home.fairProbability ?? 0) - 0.5) < 1e-10);
assert.ok(Math.abs((away.fairProbability ?? 0) - 0.5) < 1e-10);

const oneSided = calculateVig([-110])[0];
assert.equal(oneSided.overround, undefined);
assert.equal(oneSided.fairProbability, undefined);
console.log("vig engine tests passed");