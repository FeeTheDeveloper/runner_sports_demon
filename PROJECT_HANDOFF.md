# FEE THE DEVELOPER — FULL SCOPE PROJECT HANDOFF

## PROJECT

Runner Sports & Analytics

Primary Intelligence Repository:

https://github.com/FeeTheDeveloper/runner_sports_demon

Related Presentation / Product Repository:

https://github.com/FeeTheDeveloper/runner_sports-site

Owner:

Fee The Developer
Runner Sports & Analytics

---

# ROLE ASSIGNMENT

Effective immediately:

## FEE THE DEVELOPER OWNS

All development, engineering, repository, infrastructure, deployment, testing, integration, and technical implementation tasks.

Fee The Developer is the technical execution authority for the Runner Sports ecosystem.

This includes:

- GitHub
- VS Code
- Codex
- Claude Code where needed
- Supabase
- Vercel
- APIs
- databases
- pipelines
- real-time feeds
- model implementation
- testing
- deployment
- CI/CD
- schema design
- WebSockets
- dashboards
- services
- observability
- DevOps
- security
- credentials/environment management
- technical documentation
- production reliability

---

# RUNNER SPORTS & ANALYTICS INTELLIGENCE ROLE

Runner Sports & Analytics AI will no longer manage routine development or repository execution.

Its primary responsibilities are now:

- analytical research
- sports-market intelligence
- live-game strategy
- market-outlet research
- competitor research
- model strategy
- formula development
- signal design
- game-state interpretation
- in-game market theory
- Kalshi research
- Polymarket research
- sportsbook-market research
- BettingPros research
- Outlier research
- content intelligence
- media strategy
- public-facing analytics
- educational content
- creative campaign development
- generative image concepts
- generative video concepts
- postgame analytical review
- signal-performance review
- strategy refinement
- product intelligence

The AI should continuously develop better analytical frameworks and provide those frameworks to Fee The Developer for implementation.

---

# PRIMARY PRODUCT THESIS

Runner Sports is not simply a sportsbook comparison tool.

Runner Sports Demon is a continuously updating sports intelligence engine.

The central problem is:

> What should the probability of every relevant outcome be RIGHT NOW based on what is actually happening in the game, and which available markets have not fully incorporated that information?

The engine must continuously observe:

GAME STATE
MARKET STATE
PLAYER STATE
TEAM STATE
INJURY STATE
PERSONNEL STATE
COACHING STATE
TIME
SCORE
POSSESSION
LIQUIDITY
ORDER BOOK
MARKET PRICE
SPORTSBOOK PRICE
KALSHI PRICE
POLYMARKET PRICE

Then determine:

WHAT CHANGED
WHY IT MATTERS
WHAT PROBABILITY CHANGED
WHICH MARKETS ARE AFFECTED
HOW MUCH THEY SHOULD MOVE
HOW MUCH THEY ACTUALLY MOVED
HOW LONG THE DISCREPANCY LASTED
WHETHER IT WAS ACTIONABLE
WHAT HAPPENED AFTERWARD

---

# CORE SYSTEM ARCHITECTURE

Runner Sports Demon should remain the intelligence engine.

Runner Sports Site should remain primarily the product and presentation layer.

The architecture should continue moving toward:

```text
LIVE SPORTS SOURCES
       ↓
GAME STATE ENGINE
       ↓
STATE TRANSITION ENGINE
       ↓
RUNNER PROBABILITY ENGINE
       ↓
MARKET MAPPING
       ↓
KALSHI / POLYMARKET / SPORTSBOOKS
       ↓
MARKET REACTION ENGINE
       ↓
SIGNAL ENGINE
       ↓
STRATEGY ENGINE
       ↓
API / DASHBOARD / ALERTS
       ↓
REPLAY / BACKTEST / CALIBRATION
```

---

# ENGINEERING OWNERSHIP

Fee The Developer must independently manage all repository work.

Do not wait for Runner Sports AI to perform technical implementation.

When analytical specifications are supplied, convert them into:

- schemas
- interfaces
- services
- models
- database tables
- APIs
- tests
- jobs
- WebSocket systems
- dashboards
- configuration
- documentation

---

# DEV WORKFLOW

Preferred engineering workflow:

Fee The Developer
→ GitHub
→ VS Code
→ Codex / Claude Code
→ local testing
→ Git branch
→ pull request
→ test
→ merge
→ deploy
→ observe
→ calibrate

All technical work should be version controlled.

No important production logic should exist only in chat.

---

# REPOSITORY DISCIPLINE

Maintain clear branches.

Suggested:

```text
main
develop
feature/*
fix/*
model/*
data/*
signal/*
infra/*
research-integration/*
```

Do not make untracked production changes.

Every significant implementation should have:

- issue or task
- branch
- tests
- documentation
- PR
- review
- merge
- version note

---

# TECHNICAL DOCUMENTATION

Maintain:

README.md
ARCHITECTURE.md
CURRENT_IMPLEMENTATION.md
DATA_SOURCES.md
DATA_SCHEMA.md
MODEL_REGISTRY.md
FORMULAS.md
SIGNAL_REGISTRY.md
MARKET_TAXONOMY.md
GAME_STATE_SCHEMA.md
REPLAY.md
BACKTESTING.md
DEPLOYMENT.md
OPERATIONS.md
INCIDENTS.md
CHANGELOG.md

These documents are the continuity layer for all AI coding assistants.

---

# DATA PRIORITIES

The engineering stack should prioritize reliable, timestamped live data.

Potential source categories:

- existing Runner feeds
- ESPN-compatible data
- Odds API
- Kalshi
- Polymarket
- public league sources
- sports data vendors
- verified research sources
- authorized commercial research tools

Every provider record should track:

source
provider ID
Runner canonical ID
source timestamp
received timestamp
processed timestamp
latency
status
confidence
data version

---

# CANONICAL RUNNER EVENT SYSTEM

All external events must map into Runner identifiers.

Example:

```text
RUNNER:NFL:2026-09-05:DAL:PHI
```

Provider mappings should connect:

Runner Event ID
ESPN ID
Odds API ID
Kalshi ID
Polymarket ID
league/provider IDs

Prefer deterministic matching.

Use fuzzy matching only as fallback.

Persist mapping confidence.

---

# GAME STATE ENGINE

Build sport-specific state engines.

## FOOTBALL

Track:

- score
- quarter
- clock
- possession
- down
- distance
- field position
- red-zone state
- drives
- timeouts
- turnovers
- penalties
- explosive plays
- sacks
- pressure where available
- personnel
- player availability

## BASKETBALL

Track:

- score
- quarter
- clock
- possession
- pace
- fouls
- timeouts
- lineup state
- shooting
- turnovers
- scoring runs
- player availability

## BASEBALL

Track:

- inning
- half inning
- outs
- runners
- count
- pitcher
- batter
- pitch count
- bullpen
- score
- leverage
- lineup state

Expand by sport as required.

---

# ANALYTICAL MODELS TO IMPLEMENT

Fee The Developer should implement models based on Runner research specifications.

Initial model families:

- live win probability
- score/time probability
- possession value
- game-regime classification
- state impact
- market reaction
- market assimilation
- edge decay
- market migration
- dependency divergence
- garbage time
- player impact
- injury impact
- matchup strength
- trench advantage
- QB pressure profile
- functional availability
- opponent quality
- market consensus
- live fair value
- ensemble probability

---

# INITIAL PROPRIETARY FORMULAS

## STATE IMPACT SCORE — SIS

Purpose:

Measure how much a single event changes expected future game outcomes.

Candidate components:

- win probability delta
- expected-points delta
- leverage
- time remaining
- possession significance
- field position
- personnel importance
- market sensitivity

Implementation should expose components separately.

## PROBABILITY SHOCK INDEX — PSI

```text
PSI = |P_new - P_previous|
```

Used to measure probability change after a game-state transition.

## UNABSORBED PROBABILITY DELTA — UPD

```text
UPD =
Runner Probability Change
-
Observed Market Probability Change
```

Both changes must use aligned event windows.

## MARKET ASSIMILATION RATIO — MAR

```text
MAR =
Market Probability Change
/
Runner Expected Probability Change
```

Potential classes:

SEVERELY_UNDERREACTED
UNDERREACTED
PARTIALLY_ASSIMILATED
ASSIMILATED
OVERREACTED
INDETERMINATE

Thresholds should remain configurable.

## OPPORTUNITY HALF-LIFE — OHL

Measure how quickly an apparent edge disappears.

Persist:

initial edge
peak edge
peak timestamp
75% edge timestamp
50% edge timestamp
25% edge timestamp
normalization timestamp
total duration

## INFORMATION DECAY INDEX — IDI

```text
IDI =
Current Edge
/
Initial Edge
```

Used to determine whether a signal still has usable information value.

## LIVE EDGE SCORE — LES

Initial conceptual components:

- raw edge
- model confidence
- data freshness
- liquidity
- market sensitivity
- persistence
- execution quality

Do not hide component values.

Version formula changes.

## FUNCTIONAL AVAILABILITY SCORE — FAS

Develop a quantitative framework for player availability beyond binary injury status.

Conceptual scale:

```text
100 = full role
85 = minor issue
70 = meaningful limitation
50 = reduced/rotational role
25 = emergency-only
0 = unavailable
```

Do not assign values without evidence.

Eventually calculate unit-level FAS:

QB
OL
WR/TE
DL
EDGE
LB
CB
S

## TRENCH DIFFERENTIAL — TDX

Create separate:

PASS TDX
RUN TDX

Inputs may include:

- pressure allowed
- pressure generated
- sack conversion
- pass-block efficiency
- run-block efficiency
- stuff rate
- havoc
- line continuity
- opponent-adjusted strength

---

# QB PRESSURE PROFILE

Track:

- clean-pocket efficiency
- pressured efficiency
- pressure-to-sack rate
- turnover-worthy rate
- blitz efficiency
- man coverage efficiency
- zone efficiency
- deep efficiency
- third-down efficiency

Match quarterback weakness directly against opponent pressure generation.

---

# OPPONENT QUALITY ADJUSTMENT

Develop opponent-adjusted metrics so surface rankings are not accepted blindly.

Examples:

- adjusted PPA
- adjusted EPA
- adjusted success rate
- adjusted defensive efficiency
- adjusted explosive-play suppression
- adjusted scoring efficiency

Strength of schedule must influence interpretation.

---

# GAME REGIME ENGINE

Support:

BALANCED
FAVORITE_CONTROL
UNDERDOG_CONTROL
VOLATILE
COMEBACK_WINDOW
LATE_GAME
BLOWOUT
GARBAGE_TIME
OVERTIME_RISK

The system must distinguish game regime from market regime.

---

# MARKET REGIME ENGINE

Potential states:

PRICE_DISCOVERY
NORMAL
HIGH_VOLATILITY
LOW_LIQUIDITY
SUSPENDED
REOPENING
STALE
NEAR_RESOLUTION
RESOLVED

---

# MARKET MIGRATION ENGINE

When one market becomes nearly resolved, identify where uncertainty moved.

Example:

```text
Winner
→ Live Spread
→ Margin
→ Team Total
→ Next Score
→ Quarter
→ Player Threshold
→ Remaining Game Market
```

This becomes especially important during blowouts.

---

# CONTRACT DEPENDENCY GRAPH

Model logical relationships among:

- winner
- team totals
- game totals
- margins
- next score
- quarter results
- player props
- milestone markets
- prediction-market contracts

Possible relationship types:

POSITIVE_RELATIONSHIP
NEGATIVE_RELATIONSHIP
CONDITIONAL_RELATIONSHIP
SHARED_STATE_DRIVER
LOGICAL_DEPENDENCY

Do not assume exact numerical correlation without evidence.

---

# DEPENDENCY DIVERGENCE

When one related contract reprices and another does not, flag:

```text
DEPENDENCY_DIVERGENCE
```

This should include:

source market
related market
expected direction
actual movement
confidence
liquidity
timing
game state

---

# LATENT STATE CHANGES

The architecture must support non-score events.

Examples:

- injury
- mobility limitation
- substitution
- snap restriction
- scheme shift
- coverage change
- blitz change
- tempo change
- fatigue
- weather
- coaching tendency change

These can influence probabilities before the scoreboard changes.

---

# SIGNAL ENGINE

The initial signal registry should include:

STATE_SHOCK
MARKET_LAG
MODEL_DIVERGENCE
CROSS_MARKET_DIVERGENCE
UNDERREACTION
OVERREACTION
DEPENDENCY_DIVERGENCE
LATENT_STATE_CHANGE
REGIME_SHIFT
MARKET_MIGRATION
LIQUIDITY_SHIFT
ORDERBOOK_IMBALANCE
PRICE_ACCELERATION
MARKET_REVERSAL
VOLATILITY_SPIKE
STALE_MARKET
EDGE_DECAY

---

# SIGNAL SUPPRESSION

Not every discrepancy is actionable.

Implement suppression reasons:

LOW_EDGE
LOW_CONFIDENCE
LOW_LIQUIDITY
STALE_GAME_DATA
STALE_MARKET_DATA
EXCESSIVE_SPREAD
EXCESSIVE_LATENCY
MODEL_CONFLICT
MISSING_DATA
MARKET_SUSPENDED
EVENT_MAPPING_UNCERTAIN
UNSUPPORTED_MARKET

Persist suppression events for research.

---

# NO BLIND TRADING

No automatic trading should be enabled until:

- models are calibrated
- feeds are reliable
- replay works
- backtesting works
- transaction costs are represented
- liquidity is represented
- execution latency is represented
- signal performance is validated

The initial product is intelligence-first.

---

# EVENT STORAGE

Every important event should be permanently replayable.

Persist:

games
game_events
game_state_snapshots
markets
market_prices
orderbooks
trades
provider_mappings
predictions
probability_transitions
signals
suppressions
alerts
market_reactions
regime_transitions
dependency_events
research_annotations
replay_sessions
backtests

---

# REPLAY

Every completed event should be replayable chronologically.

Replay:

game state
market prices
orderbooks
model outputs
signals
suppression
alerts
market reactions
regime changes

The system should behave as if the game were live.

Replay is mandatory for model research.

---

# BACKTESTING

Evaluate:

- calibration
- Brier score
- log loss
- false-positive rate
- signal duration
- favorable movement
- adverse movement
- latency
- market reaction speed
- edge realization
- market assimilation
- regime accuracy

Do not use win rate alone.

---

# OBSERVABILITY

Every source must expose health.

Track:

CONNECTED
DISCONNECTED
DEGRADED
STALE
RECONNECTING

Include:

last event
last timestamp
latency
error count
reconnect attempts
message count
provider status

Never silently operate on stale feeds.

---

# CLAUDE OPERATING RELATIONSHIP

Claude serves as an active browser research and analytical observation operator.

Claude may research authorized company environments including:

- BettingPros
- Outlier
- Kalshi
- Polymarket
- sportsbooks
- sports research platforms

Claude output should feed:

COMPETITOR RESEARCH
FEATURE RESEARCH
GAME OBSERVATIONS
MARKET OBSERVATIONS
FORMULA IDEAS
ENGINEERING REQUIREMENTS

Fee The Developer converts those findings into measurable technical implementation.

Do not blindly copy competitor behavior.

Build independent Runner solutions.

---

# GEMINI OPERATING RELATIONSHIP

Gemini serves as:

- Google Workspace research organizer
- institutional knowledge manager
- visual-reference researcher
- content research assistant
- generative media prompt builder

Gemini should preserve:

game research
player intelligence
team intelligence
competitor analysis
model documentation
media references
campaign material
postgame reports

Gemini should not become the engineering authority.

---

# RUNNER SPORTS AI OPERATING RELATIONSHIP

Runner Sports AI focuses on:

## OUTLETS

- BettingPros
- Outlier
- Kalshi
- Polymarket
- sportsbook research
- sports analytics platforms
- public sports intelligence
- relevant media
- statistical providers

## ANALYTICS STRATEGY

- matchup logic
- game-state logic
- market interpretation
- new formulas
- signal refinement
- market migration
- blowout research
- situational analysis
- player impact
- injury analysis
- timing research
- model calibration recommendations

## CONTENT

- game previews
- live intelligence
- postgame reviews
- educational content
- graphics concepts
- videos
- short-form scripts
- social media
- market explainers
- signal explainers
- brand campaigns

Runner Sports AI should feed Fee The Developer specifications rather than manage repositories directly.

---

# RESEARCH TO ENGINEERING HANDOFF FORMAT

Whenever Runner Sports AI identifies a new feature, provide:

TITLE
PROBLEM
WHY IT MATTERS
SOURCE OBSERVATION
RUNNER OPPORTUNITY
DATA REQUIRED
FORMULA
INPUTS
OUTPUT
SIGNAL TYPE
CONFIDENCE REQUIREMENT
TIMING REQUIREMENT
EDGE CASES
TEST CASE
PRIORITY

Fee The Developer owns implementation.

---

# POSTGAME LEARNING LOOP

After important games:

Runner Sports AI evaluates:

- what it expected
- what happened
- what changed
- which signals worked
- which failed
- what market moved
- what market lagged
- what assumptions were wrong

Gemini preserves findings.

Fee The Developer updates models where justified.

The loop is:

```text
OBSERVE
↓
ANALYZE
↓
SPECIFY
↓
BUILD
↓
RUN
↓
RECORD
↓
REPLAY
↓
BACKTEST
↓
CALIBRATE
↓
IMPROVE
```

---

# PRODUCT OUTPUTS

Runner should eventually support:

## CONSUMER

- live dashboards
- game intelligence
- player analysis
- market comparisons
- signal alerts
- premium research

## PRO

- advanced analytics
- historical signal analysis
- backtesting
- custom filters
- model outputs
- APIs

## MEDIA

- game previews
- live market intelligence
- signal explainers
- analytical videos
- player research
- data storytelling

## B2B

- analytics feeds
- APIs
- licensing
- consulting
- team intelligence
- market intelligence
- data products

---

# CONTENT STRATEGY

Runner content should reinforce the intelligence product.

Avoid positioning around:

LOCKS
GUARANTEES
SURE THINGS

Focus on:

MODEL EDGE
PROBABILITY
MARKET REACTION
LIVE INTELLIGENCE
GAME STATE
INFORMATION ADVANTAGE
PLAYER IMPACT
MARKET EFFICIENCY
TIMING
DATA

---

# CORE PUBLIC POSITION

Runner Sports & Analytics should communicate:

> We do not simply tell you what the market says.

> We analyze what is happening, determine what the probabilities should be, measure how markets respond, and identify where information may not yet be fully reflected.

---

# ENGINEERING SUCCESS CONDITION

Fee The Developer succeeds when Runner Sports Demon can answer:

WHAT happened?

WHEN did it happen?

WHAT changed in the game state?

WHAT did Runner believe before?

WHAT did Runner believe after?

WHY did the probability change?

WHAT markets were affected?

WHAT did Kalshi do?

WHAT did Polymarket do?

WHAT did sportsbooks do?

HOW quickly did they react?

WHERE did disagreement remain?

HOW long did it remain?

WAS the signal actionable?

DID the market eventually move toward Runner?

WHAT did the system learn?

---

# ORGANIZATIONAL SUCCESS CONDITION

The operating model is now:

## FEE THE DEVELOPER

Builds and operates the technology.

## RUNNER SPORTS AI

Researches, analyzes, designs strategies, develops formulas, studies markets, and creates content.

## CLAUDE

Performs active browser/product/game research and feeds findings into the analytical process.

## GEMINI

Organizes institutional research in Google Workspace and supports visual/media intelligence.

## RUNNER SPORTS DEMON

Executes the quantitative and real-time intelligence.

---

# FINAL OPERATING PRINCIPLE

Do not build another betting dashboard.

Build a sports intelligence operating system capable of understanding:

THE GAME
THE PLAYERS
THE MARKET
THE INFORMATION
THE TIMING
THE REACTION
THE OPPORTUNITY

The long-term competitive advantage is not simply predicting outcomes.

The competitive advantage is understanding **how new information changes probability and how quickly—or slowly—the market understands the same thing.**

Fee The Developer owns the build from this point forward.

Runner Sports & Analytics AI owns the intelligence that keeps making the build smarter.
