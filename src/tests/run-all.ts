const suites = ["normalization", "probability", "game-flow", "totals", "totals-engine", "espn-game", "odds-api", "baseline-comparison", "persistence-api", "api", "dashboard", "site-publisher", "adversity", "games", "vig-engine"];
for (const suite of suites) await import(`./${suite}.test.js`);
console.log(`all ${suites.length} test suites passed`);
