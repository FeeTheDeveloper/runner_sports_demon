---
name: runner-youtube-research
description: Research NFL and WNBA media, analyst, bettor, and data-source videos from an authorized YouTube subscriptions list or approved channel watchlist for Runner Sports & Analytics. Use for scheduled slate reconnaissance, T-60 pregame context, source-linked claim tracking, live breaking-news checks, and handoff to Runner Demon market research.
---

# Runner YouTube Research

Version: 1.0.0  
Owner: Runner Sports & Analytics intelligence desk.  
Executor: Claude/Claude Code under Fee The Developer technical assignment.  
Controller: King Fee.  
Companion: `.claude/skills/runner-market-research/SKILL.md`. This skill supplies attributed media context, not prices or independent model probabilities.

## Authority and setup

1. Read repository `AGENTS.md`, `CLAUDE.md`, source/rights documentation, and the companion skill before changing a pipeline or publishing a packet. Identify the Runner entity, assignment, environment, slate, audience, timezone, and intended output. Demon owns research/replay; the site presents approved derived records; `rsaa_verse` owns historical assets.
2. Use a channel registry from an owner-approved list or a specifically authorized YouTube account's subscription list. Record channel ID, URL, topic/sport, analyst identity, official/media/independent/bettor classification, disclosure/affiliation, last reviewed, and permission state. A personal subscription is a discovery signal, not an endorsement or a license. Do not assert that a subscription connection exists until verified.
3. If a connection is approved, use the documented YouTube Data API and least-privilege OAuth to retrieve the authenticated user's subscriptions (for example, `subscriptions.list` with `mine=true`), then official video/channel metadata endpoints to discover uploads. Keep tokens out of prompts, logs, repositories, and packets. Paginate, honor quota/rate limits, deletions, privacy settings, and revocation. An account sign-in or subscription does not authorize bulk downloading, scraping, republishing, or storing full video/caption content.
4. Review YouTube API Terms and Developer Policies and any creator permissions before automated use, retention, display, or redistribution. The captions-list API returns track metadata, not transcript text. Do not presume third-party transcript access or evade player restrictions; use authorized transcript/caption access only when expressly available, otherwise view permitted videos and record concise original analytical notes with video/time links. Never copy full transcripts, lengthy quotations, protected charts, or paywalled content into Runner.
5. Do not use agent aliases to impersonate creators, comment, like, subscribe, message, or simulate organic viewers. No external sends or public engagement without a distinct authorization. Keep channel subscription data private; publish only rights-cleared derived insights and attribution.

## Cadence and selection

- **Daily early pass:** review the next 24–72 hours of NFL/WNBA games. Discover new videos from approved channels; prioritize schedule-relevant, recent, primary reporting and substantiated analysis. Deduplicate video IDs and syndicated clips. Capture publish time and observation time separately.
- **Game-day morning / T-180:** refresh injury, lineup, coaching, rotation, weather, matchup, player-usage and market-narrative claims. Map to canonical game/team/player IDs, including timezone and scheduled start changes.
- **T-60 essential handoff:** freeze a source-linked media-context packet for the companion pregame research run. Include confirmed changes, contested claims, source age, counterviews, affected markets/props, and explicit validation tasks. Do not delay the pregame packet waiting on a video.
- **T-30/T-10 and live:** check only material new uploads or updates, official confirmation, and relevant live reports. Mark a pregame claim invalidated after a roster/role/injury/regime change. Do not treat a creator's stream as official live state or current executable odds.
- **Postgame / weekly:** append claim outcomes and corrections without rewriting the original record. Review source calibration, timeliness, sport/market coverage, corrections, and incentive bias. Avoid ranking creators by a cherry-picked win rate or financially promoting them.

A schedule in this file is an operating specification, not a deployed job. Implement idempotent jobs, health alerts, backfill limits, and rescheduling in the existing control plane only under an authorized engineering assignment. If no connection exists, use approved public links or a supplied watchlist for manual research and report `CONNECTION_NOT_CONFIGURED`.

## Claim extraction and validation

For each relevant video, create an immutable `media_claim` record with:

- Identity: video ID/URL, channel ID, creator/speaker, publish UTC, observed UTC, content type (video/live/Short), segment timestamp/link, language, collection method, rights class.
- Context: NFL/WNBA event ID, team/player canonical ID, game start UTC, market/period/line if mentioned, horizon, exact claim type (availability, role, usage, matchup, quantified projection, market observation, opinion, recommendation).
- Evidence: concise paraphrase, narrowly necessary short quote only if permitted, on-screen/source basis, linked original data, whether sponsor/affiliate/promotional content, and any declared stake or conflict. Do not copy an odds quote as if current; record its spoken/as-of time.
- Assessment: `FACT_CANDIDATE`, `OPINION`, `INFERENCE`, `PREDICTION`, `MARKET_OBSERVATION`, `RUMOR`, `CONTESTED`, or `UNKNOWN`; source reliability, corroboration, countercase, confidence, freshness/expiry, validation owner, and current status.
- Audit: source hash/metadata version if allowed, prior record link, correction/withdrawal marker, downstream packet ID, publication state, and explicit `NOT_SENT`/`NOT_PUBLISHED` when applicable.

Procedure:

1. Select by canonical game/sport relevance, recency, source competence, and diversity of viewpoints—not follower count alone. Separate official league/team/player reporting from journalists, film/analytics, bettors, sponsored picks, and aggregators. Track when several videos repeat one original report; they are not independent confirmation.
2. Extract atomic claims with segment links. Attribute to the actual speaker and retain uncertainty, conditional language, and timing. Do not infer a transcript from title/thumbnail/description alone; label metadata-only leads `UNREVIEWED`.
3. Cross-check factual claims (injury status, lineup, minutes, depth chart, availability, game time, statistics) against current official or licensed sources. A bettor's view may suggest a hypothesis; it does not establish a fact. Preserve conflicts and official correction time.
4. Map a claim to affected game/team/position/prop/alternate-line families as a **research question**. E.g., an expected minutes change may alter WNBA points/rebounds/assists; NFL weather may affect passing/kicking/total. Never silently mutate model features from video commentary. Require data lineage, feature eligibility, versioned model/replay, and human/quality gate for promotion.
5. Compare market narratives with the companion skill's verified quotes and calibrated Runner probabilities only when both exist. Keep `creator_prediction`, `Runner_model_probability`, `market_implied_probability`, `fair_price`, and `executable_price` separate. Without independent model and fresh quote, edge remains `UNKNOWN`.
6. For suggested parlays/combos or alternate lines, record the cited legs/thresholds as hypotheses. Verify each offered line, settlement period, availability, correlation, joint-model eligibility, and price via approved market sources. Do not multiply dependent marginal probabilities or reproduce a creator's slip as a Runner recommendation.
7. Deliver concise attributed insights with countercase and validation status. Mark uncorroborated injury/news as `UNVERIFIED` and suppress public alerts or action prompts until validated. Preserve a correction trail and promptly retract stale downstream claims.

## Output contract

Return one run packet per slate and event:

- Run ID, phase, generated UTC/CT, scheduled games and source cutoff, registry version, connection/rights status, videos scanned/reviewed/skipped, coverage gaps, and next refresh.
- A claim table: event/player, claim type, paraphrase, source/video/time link, published/observed times, classification, corroboration link, freshness, affected markets, countercase, and `USE_AS_CONTEXT` / `VERIFY` / `DO_NOT_USE`.
- An evidence summary separating verified factual changes, contested/rumor items, creator opinions/predictions, and missing official confirmation.
- Handoff to `runner-market-research`: immutable claim IDs and canonical IDs, potential feature impact, verification tasks, deadline, and an explicit rule that no prediction/edge is inferred from this packet alone.
- Audit: collection permissions, redactions, corrections, skipped/private/deleted videos, rights exceptions, notification/publication IDs or `NOT_SENT`/`NOT_PUBLISHED`.

## Verification and stop conditions

- Test OAuth revocation/missing consent, private or deleted uploads, pagination, duplicates, timezone/schedule moves, live-video edits, false-positive player identity, conflicting claims, a paid promotion, metadata-only video, stale odds mention, and transcript permission failure.
- Replay an NFL injury rumor and a WNBA rotation take: neither may become a verified fact or numerical Runner edge without independent evidence/model/quote; late corrections must append and invalidate downstream context.
- For any implementation, run the repository's applicable build/tests and rights review, then return changed paths, commit/PR, sample redacted packet, source/permission evidence, test results, and blockers. The skill alone does not connect YouTube, access subscriptions, create a scheduler, or run research.
- Stop only the blocked collection/publication path when consent, rights, source access, or canonical identity is missing. Continue permissible manual or official-source research and escalate material rights/authority decisions to King Fee.

## Example request

“Review my authorized YouTube sports subscriptions for this week's NFL and WNBA slate, collect the most relevant analyst and bettor perspectives, and send the T-60 context packet to Demon.” First verify the connection/watchlist and rights; deliver linked, classified claims and gaps. If the connection is absent, request the approved channel list or scoped OAuth setup and do not claim a completed subscription review.
