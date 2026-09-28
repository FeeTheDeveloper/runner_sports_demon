---
name: "runner-youtube-research"
description: "Use when a YouTube, broadcast or streamed video is the source for Runner Sports research: taking captions or transcripts into the Demon, running Gemini commentary analysis, recording a YOUTUBE_TV_OBSERVATION, reconciling something heard on air against the scoreboard, or deciding whether a video-derived claim may inform a model, a signal or anything published."
---

# Runner YouTube research

## Overview

Video is an **observational** source. ESPN and other machine-readable feeds remain authoritative for numerical game state (`ARCHITECTURE.md`). A broadcast can tell you a quarterback changed before any feed does; it can never tell you the score.

Everything video-derived enters through one path: `scripts/transcript-intake.mjs`, which produces a hashed private receipt classified `UNVERIFIED_COMMENTARY`. There is no second path. The repo does not ingest, archive, restream or transcribe video, and this skill never adds one.

## When to use

- A caption file (`.vtt`, `.srt`, `.txt`) is on hand for an authorized video
- Something said on a broadcast needs to reach Game Flow as an observation
- A video-derived claim needs reconciling against the scoreboard before use
- Deciding whether a video claim can feed a model, a signal, or a published statement

Not for: obtaining video, downloading streams, or anything requiring credentials you were not given.

## Rights gate — settle this first

`--rights` takes `OWNER`, `LICENSED`, or `PUBLIC_DOMAIN`. It **records the operator's stated basis; it does not establish rights.** If the basis is unclear, stop and ask the owner. Do not proceed on an assumption.

Never: rip streams, use browser cookies to fetch media, capture or restream a broadcast, or bypass access controls. YouTube's official caption download API requires permission to edit the video. The Browser plugin may export a transcript only where YouTube itself exposes one.

## Intake

```powershell
node scripts/transcript-intake.mjs --file C:\path\captions.vtt --source-url https://www.youtube.com/watch?v=VIDEO_ID --rights OWNER --event-id ESPN_EVENT_ID
```

Writes `.runner/transcripts/<stamp>-<sha256-12>.json`, mode `0600`, gitignored. Caption files cap at 1 MB. The receipt is private; it is not repository documentation and does not get quoted into shared docs.

**Gemini is opt-in and off by default.** The default run prepares the prompt and stops at `READY_NOT_SENT`. Sending requires both flags plus the key:

```powershell
node --env-file-if-exists=.env scripts/transcript-intake.mjs --file C:\path\captions.vtt --source-url https://www.youtube.com/watch?v=VIDEO_ID --rights OWNER --event-id ESPN_EVENT_ID --send-to-gemini --authorize-transfer
```

`--send-to-gemini` without `--authorize-transfer` is refused. `GEMINI_API_KEY` must be configured (`.env.example` is the variable contract). Up to 20,000 transcript characters go to Google via `gemini-3.8-flash`; the reply is stored as `ANALYZED_UNVERIFIED` and is untrusted commentary about untrusted commentary. Sending is an external transfer of owner material — confirm it is wanted for that specific file, every time.

## Recording an observation

```
POST /observations   Authorization: Bearer $RUNNER_API_BEARER_TOKEN
{ "id": "...", "runnerEventId": "...", "source": "YOUTUBE_TV_OBSERVATION",
  "observedAt": "...", "receivedAt": "...", "notes": "..." }
```

`id`, `runnerEventId` and `source` are required strings; `observedAt` and `receivedAt` are required timestamps. Scores, period and clock are optional — **leave them absent.** Let the authoritative feed carry them.

Set `confidence` honestly and `causality` to `UNKNOWN` or `CONTESTED` unless a second source supports the claim. Video is often the first sighting of `QB_SUBSTITUTION`, `PLAYER_INJURY`, `WEATHER_CHANGE` and `COACH_DECISION` — exactly the adversity types with no feed equivalent, and exactly where a wrong call is expensive.

## Quick reference

| Question | Answer |
|---|---|
| Classification of any transcript | `UNVERIFIED_COMMENTARY` |
| Event mapping with `--event-id` | `USER_SUPPLIED_UNVERIFIED`, never "mapped" |
| Event mapping without it | `UNMAPPED` |
| Gemini default | `READY_NOT_SENT` |
| Approved as model input | No |
| Approved for publication | No |
| Authoritative for score, clock, period | No — ESPN and machine-readable feeds are |

## The line that matters

A video-derived claim may **prompt** verification. It may never **be** the verification. Before a broadcast claim changes a model input, a signal, a matchup sheet or anything the Site shows, it must be confirmed against the official source for that fact — the scoreboard feed, the injury report, the inactives list, a club release. Record what the video said and what confirmed it, separately.

## Common mistakes

| Rationalization | Reality |
|---|---|
| "The broadcast said the score, so I'll fill in `homeScore`" | The feed owns numerical state. Sending a video score creates a competing truth. Leave it absent. |
| "The announcers are reliable, mark it `SUPPORTED`" | `SUPPORTED` means a second source supports it. One broadcast is one source. |
| "Gemini summarized it, so it's analysis now" | A model summarizing untrusted commentary produces untrusted commentary. Status stays `ANALYZED_UNVERIFIED`. |
| "`--rights OWNER` means we cleared the rights" | The flag records a claim. It clears nothing. |
| "It's faster to send it to Gemini and ask later" | That is an external transfer of owner material. Confirm first, every file. |
| "The receipt has the good quotes, I'll paste them into the handoff" | Receipts are private and gitignored for a reason. Reference the receipt filename, not its contents. |
| "No caption file exists, I'll just pull the stream" | There is no authorized path to media. Stop and ask the owner for captions. |

## Red flags — stop

- About to set `homeScore`, `awayScore`, `period` or `clockSecondsRemaining` from something heard on air
- About to write a win probability, edge, or hold/sell call from a transcript
- About to run `--send-to-gemini` without having confirmed it for this file
- About to publish, or hand to the Site, a claim whose only source is a video
- Reaching for cookies, a downloader, or any media fetch

All of these mean: record the observation, mark it unverified, and go get the official source.
