---
name: media-research
description: "Attributed media and analyst research for Runner Sports & Analytics from an owner-approved YouTube channel watchlist or authorized subscriptions list. This skill should be used when the user asks to \"review my sports subscriptions\", \"check the watchlist\", \"what are analysts saying about tonight's slate\", \"track this creator's claim\", \"pull the T-60 media context\", \"verify this injury rumor from a video\", or \"send media context to Demon\". Produces source-linked, classified claim records for NFL, NBA, WNBA, MLB, NHL, NCAAF, and men's NCAAB and hands them to slate-research as research questions. Supplies context, never prices or independent model probabilities.\n"
metadata:
  version: "0.1.0"
  owner: "Runner Sports & Analytics LLC"
  lineage: "runner-youtube-research 1.1.0"
---

# Media Research

Load `../intelligence-desk/SKILL.md` first and apply its lock, evidence classification, source hierarchy (creator content is Tier C or Tier D until corroborated), and security rules throughout. Companion: `../slate-research/SKILL.md`. This skill supplies attributed media context, not prices or independent model probabilities.

Owner: Runner Sports & Analytics intelligence desk. Controller: King Fee. Demon owns research and replay; the site presents approved derived records; `rsaa_verse` owns historical assets.

## Authority and setup

1. When working inside a Runner repository, read `AGENTS.md`, `CLAUDE.md`, source and rights documentation, and the companion skill before changing a pipeline or publishing a packet. Identify the entity, assignment, environment, slate, audience, timezone, and intended output.
2. Use a channel registry from an owner-approved list or a specifically authorized YouTube account's subscription list. Record channel ID, URL, topic or sport, analyst identity, classification (official / media / independent / bettor), disclosure or affiliation, last reviewed, and permission state. A personal subscription is a discovery signal, not an endorsement or a license. Do not assert that a subscription connection exists until verified in the session.
3. When a connection is approved, use the documented YouTube Data API and least-privilege OAuth to retrieve the authenticated user's subscriptions (for example `subscriptions.list` with `mine=true`), then official video and channel metadata endpoints to discover uploads. Keep tokens out of prompts, logs, repositories, and packets. Paginate and honor quota and rate limits, deletions, privacy settings, and revocation. A sign-in or subscription does not authorize bulk downloading, scraping, republishing, or storing full video or caption content.
4. Review YouTube API Terms and Developer Policies and any creator permissions before automated use, retention, display, or redistribution. The captions-list API returns track metadata, not transcript text. Do not presume third-party transcript access or evade player restrictions; use authorized transcript or caption access only when expressly available, otherwise view permitted videos and record concise original analytical notes with video and time links. Never copy full transcripts, lengthy quotations, protected charts, or paywalled content into Runner.
5. Do not impersonate creators, comment, like, subscribe, message, or simulate organic viewers. No external sends or public engagement without separate authorization. Keep subscription data private; publish only rights-cleared derived insights with attribution.

## Cadence and selection

- **Daily early pass:** review the next 24–72 hours of games across the covered sports. Discover new videos from approved channels; prioritize schedule-relevant, recent, primary reporting and substantiated analysis. Deduplicate video IDs and syndicated clips. Capture publish time and observation time separately. Mark offseason or no-slate sports explicitly.
- **Game-day morning / T-180:** refresh injury, lineup, coaching, rotation, weather (football, baseball), starting pitcher (MLB), starting goalie and line combinations (NHL), college roster, transfer, and availability, matchup, player-usage, and market-narrative claims. Map to canonical sport, competition, game, team, and player IDs, including timezone and start-time changes.
- **T-60 essential handoff:** freeze a source-linked media-context packet for the companion pregame research run. Include confirmed changes, contested claims, source age, counterviews, affected markets and props, and explicit validation tasks. Do not delay the pregame packet waiting on a video.
- **T-30/T-10 and live:** check only material new uploads or updates, official confirmation, and relevant live reports; feed confirmed items to `../live-desk/SKILL.md`. Mark a pregame claim invalidated after a roster, role, injury, or regime change. Never treat a creator's stream as official live state or a current executable quote.
- **Postgame / weekly:** append claim outcomes and corrections without rewriting the original record. Review source calibration, timeliness, coverage, corrections, and incentive bias. Do not rank creators by a cherry-picked win rate or promote them financially.

A schedule in this file is an operating specification, not a deployed job. Implement idempotent jobs, health alerts, backfill limits, and rescheduling in the existing control plane only under an authorized engineering assignment via `../engineering-handoff/SKILL.md`. When no connection exists, use approved public links or a supplied watchlist for manual research and report `CONNECTION_NOT_CONFIGURED`.

## Claim extraction and validation

For each relevant video, create an immutable `media_claim` record with:

- **Identity:** video ID and URL, channel ID, creator or speaker, publish UTC, observed UTC, content type (video / live / Short), segment timestamp and link, language, collection method, rights class.
- **Context:** sport and competition and event ID; team or player canonical ID; game start UTC; market, period, and line if mentioned; horizon; exact claim type (availability, role, usage, matchup, quantified projection, market observation, opinion, recommendation).
- **Evidence:** concise paraphrase; a narrowly necessary short quote only when permitted; on-screen or source basis; linked original data; whether sponsor, affiliate, or promotional content; any declared stake or conflict. Do not copy an odds quote as if current; record its spoken as-of time.
- **Assessment:** `FACT_CANDIDATE`, `OPINION`, `INFERENCE`, `PREDICTION`, `MARKET_OBSERVATION`, `RUMOR`, `CONTESTED`, or `UNKNOWN`; source reliability, corroboration, countercase, confidence, freshness and expiry, validation owner, current status.
- **Audit:** source hash or metadata version if allowed, prior record link, correction or withdrawal marker, downstream packet ID, publication state, and explicit `NOT_SENT` / `NOT_PUBLISHED` when applicable.

Procedure:

1. Select by canonical game and sport relevance, recency, source competence, and diversity of viewpoints, not follower count. Separate official league, team, and player reporting from journalists, film and analytics creators, bettors, sponsored picks, and aggregators. Track when several videos repeat one original report; they are not independent confirmation.
2. Extract atomic claims with segment links. Attribute to the actual speaker and retain uncertainty, conditional language, and timing. Do not infer a transcript from title, thumbnail, or description; label metadata-only leads `UNREVIEWED`.
3. Cross-check factual claims (injury status, lineup, minutes, depth chart, availability, game time, statistics) against current official or licensed sources. A bettor's view suggests a hypothesis; it does not establish a fact. Preserve conflicts and the official correction time.
4. Map a claim to affected game, team, position, prop, and alternate-line families as a **research question**. Basketball minutes may alter points, rebounds, and assists; football weather may affect passing, kicking, and the total; an NHL goalie change may affect saves, goals, and totals; an MLB pitcher scratch may affect strikeouts, F5, and the total; a college transfer or depth-chart change may affect playing time. Never silently mutate model features from video commentary. Require data lineage, feature eligibility, versioned model or replay, and a human or quality gate for promotion.
5. Compare market narratives with the companion skill's verified quotes and calibrated Runner probabilities only when both exist. Keep `creator_prediction`, `runner_model_probability`, `market_implied_probability`, `fair_price`, and `executable_price` separate. Without an independent model and a fresh quote, edge remains `UNKNOWN`.
6. For suggested parlays, combos, or alternate lines, record the cited legs and thresholds as hypotheses. Verify each offered line, settlement period, availability, correlation, joint-model eligibility, and price via approved market sources. Do not multiply dependent marginal probabilities or reproduce a creator's slip as a Runner recommendation.
7. Deliver concise attributed insights with countercase and validation status. Mark uncorroborated injury or news as `UNVERIFIED` and suppress public alerts or action prompts until validated. Preserve a correction trail and promptly retract stale downstream claims.

## Output contract

Return one run packet per slate and event:

- Run ID, phase, generated UTC/CT, scheduled games and source cutoff, registry version, connection and rights status, videos scanned / reviewed / skipped, coverage gaps, next refresh.
- A claim table: event or player, claim type, paraphrase, source video and time link, published and observed times, classification, corroboration link, freshness, affected markets, countercase, and `USE_AS_CONTEXT` / `VERIFY` / `DO_NOT_USE`.
- An evidence summary separating verified factual changes, contested or rumor items, creator opinions and predictions, and missing official confirmation.
- Handoff to `slate-research`: immutable claim IDs and canonical IDs, potential feature impact, verification tasks, deadline, and an explicit rule that no prediction or edge is inferred from this packet alone.
- Audit: collection permissions, redactions, corrections, skipped, private, or deleted videos, rights exceptions, notification or publication IDs, or `NOT_SENT` / `NOT_PUBLISHED`.

## Verification and stop conditions

- Test OAuth revocation or missing consent, private or deleted uploads, pagination, duplicates, timezone and schedule moves, live-video edits, false-positive player identity, conflicting claims, paid promotion, metadata-only video, stale odds mention, and transcript permission failure.
- Replay a football injury rumor, a basketball rotation take, an NHL goalie report, an MLB pitcher scratch, and a college depth-chart claim: none may become a verified fact or a numerical Runner edge without independent evidence, model, and quote; late corrections must append and invalidate downstream context.
- For any implementation, run the repository's applicable build, tests, and rights review, then return changed paths, commit or PR, a sample redacted packet, source and permission evidence, test results, and blockers. The skill alone does not connect YouTube, access subscriptions, create a scheduler, or run research.
- Stop only the blocked collection or publication path when consent, rights, source access, or canonical identity is missing. Continue permissible manual or official-source research and escalate material rights or authority decisions to King Fee.

## Example request

"Review my authorized YouTube sports subscriptions for this week's slates, collect relevant analyst and bettor perspectives, and send the T-60 context packet to Demon." First verify the connection or watchlist and rights; deliver linked, classified claims and gaps. When the connection is absent, request the approved channel list or scoped OAuth setup and do not claim a completed subscription review.
