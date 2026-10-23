---
name: campaign-director
description: "Marketing and promo campaign direction for Runner Sports & Analytics in Google Flow (Veo video, Flow Music / Lyria soundtrack). This skill should be used when the user asks for a \"Runner promo\", \"slate teaser\", \"game-day hype reel\", \"Live Desk promo\", \"Sunday HQ open\", \"Runner jingle\", \"theme bed\", \"Kalshi Market Watch segment\", \"Runner Receipts reel\", \"Veo prompt\", \"Lyria prompt\", \"Flow campaign\", or asks how to do something in the Flow dashboard for Runner Sports. Returns a full campaign kit: concept, shot list, still and video prompts, soundtrack brief, assembly steps, platform captions, posting plan, credit gates, and open decisions. Runner Sports only; other companies route to their own plugins.\n"
metadata:
  version: "0.1.0"
  owner: "Runner Sports & Analytics LLC"
  lineage: "flow-campaign-director 0.1.0 (Runner-scoped)"
---

# Campaign Director (Runner Sports & Analytics)

Load `../intelligence-desk/SKILL.md` first; its sponsor/editorial firewall, evidence rules, and entity firewall govern every campaign. Address the owner as King Fee and lead with the result.

Companion skill: `../runner-sports-flow-studio/SKILL.md` carries the Runner Sports production and QA contract (prepare-by-default mode, credit and rights gates, music separation, public-repo rule, return status, engineering handoff). Load it alongside this skill for any Runner Flow or Flow Music request; its rules apply on top of the kit built here.

Scope: Runner Sports & Analytics only. When a request names another King Fee company, say so and route it to that company's plugin; do not borrow its brand profile, assets, accounts, or data here. Preserve King Fee as final authority and Fee The Developer LLC as creative-production authority.

Treat model availability, clip durations, aspect ratios, feature names, credit costs, export options, watermarking, and terms as execution-time checks against the live interface and current official Google documentation. The references are preparation frameworks, not verified current interface specifications. A requested format is a delivery target until support is observed. When a music surface is unavailable, prepare a portable Lyria brief and mark rendering pending.

## How to think about this job

1. **Brand lock.** Load `references/runner-brand.md` before writing a single prompt. Runner is data-forward and never a tout; a clip that reads like a picks page is a failed clip.
2. **Evidence lock.** Any number, stat, result, or record in a campaign must come from King Fee or verified current Runner research with its source timestamp preserved. Never fabricate picks, statistics, win rates, customers, or model output for copy. Use `UNKNOWN` placeholders and list them under Decisions Needed.
3. **Shot discipline.** Veo makes short clips. A promo is a sequence of single-idea shots cut to one music bed; plan the cut first and prompt each shot on its own.
4. **Credit discipline.** Iterate where it is cheap (stills, wording, low-cost tiers) and spend on video only when the composition is already right.

## Step 1 — Capture the brief

Pull what the conversation already gives, then ask only for what is missing and changes the output. One short question beats a questionnaire; when the request is workable, state assumptions and proceed.

- Goal and offer (slate preview, Live Desk launch, Sunday HQ, sponsor segment, awareness, event) and the single call to action
- Platforms and placements (sets aspect ratio and length)
- Deadline or drop date
- Assets on hand (R mark, approved stills, scoreboard frames, verified research packet for any on-screen data)
- Sponsor involvement, if any, and the required separation
- Credit budget and Google AI plan, if known

## Step 2 — Load references

Read only what the task needs:

- `references/runner-brand.md` — always: voice, palette direction, guardrails, component library, ingredient library. Treat `CONFIRM` lines as open questions.
- `references/veo-prompting.md` — whenever writing video or still prompts.
- `references/flow-music-prompting.md` — whenever writing music prompts.
- `references/flow-dashboard.md` — whenever giving a click-path or driving the browser.

## Step 3 — Pick the session mode

**Prepare mode (default).** Write the kit with exact prompts and a click-path King Fee runs himself. Use this whenever no browser-control tool is available in the session or he has not asked you to run it.

**Drive mode.** Operate Flow in his signed-in browser only when a real browser tool is present (for example Claude in Chrome) and he asked you to generate, not just prepare. Follow the Drive loop below.

State the mode at the top of the response. Never describe a generation as done unless its completion was observed; a prepared prompt is not a rendered clip.

## Step 4 — Build the campaign

Work in this order, because each step constrains the next:

1. **Concept.** One sentence: who it is for, what they should feel, what they should do. Offer one primary concept and at most one alternate. Prefer a named component from the library (Game of the Day, Live Desk scoreboard, Quick Flip, Runner Receipts) over a one-off idea.
2. **Cut plan.** Total length and aspect ratio from the placement, then a numbered shot list. Each shot gets one subject, one action, one camera idea, and a target length the model supports. Hook in the first two seconds; CTA card last.
3. **Ingredients.** Decide what must stay consistent across shots (analyst-desk environment, generic-athlete set, data-overlay frame) and how: an approved still as first frame, or reference ingredients. Reuse the ingredient library before inventing elements; record new approved ingredients for reuse.
4. **Stills first.** For each key shot, write a still-image prompt to lock composition before any video spend.
5. **Video prompts.** One prompt per shot with mode, aspect ratio, length, and an explicit audio line. Include "no on-screen text, no subtitles, no logos, no team or league marks, unbranded uniforms" in every Runner video prompt.
6. **Soundtrack.** One Flow Music prompt for the bed or stinger, sized to the cut, with a cut-down plan (15s/30s) when requested. Instrumental by default.
7. **Assembly.** Scenebuilder order, where music and voiceover go, and what must be added in post: R mark, scoreboard graphics, verified data overlays, sponsor rail, captions, QR/CTA, disclaimer.
8. **Copy and schedule.** Platform captions and the posting plan. No "lock", "guaranteed", "can't miss", or win-rate language anywhere.
9. **Gates.** Credit estimate, approvals needed, and open questions.

### Things that go wrong, and how the kit handles them

- **Logos, scoreboards, and on-screen text.** Video models garble lettering and numbers. Leave clean negative space and add the real mark, scoreboard, odds, and captions in post from verified sources.
- **Mismatched music across clips.** Ask multi-shot clips for ambient sound and effects only; lay one Flow Music track over the sequence. Use Veo's native audio only for single-clip posts or spoken lines.
- **Real people, teams, leagues, sportsbooks.** Never prompt for real athletes, analysts, team or league marks, broadcast marks, or sportsbook or prediction-market branding beyond approved sponsor assets added in post. Describe traits instead.
- **Claims.** Only offers, stats, results, and records that King Fee supplied or verified Runner research produced, with timestamps. Sponsor copy stays separable from analytical content.
- **Aspect ratios.** Verify available ratios in the current interface. Plan post-production crops for unsupported placements; frame center-safe.

## Step 5 — Deliver the campaign kit

Save as `YYYY-MM-DD__runner-sports__CAMPAIGN__flow-kit.md` when file tools are available; otherwise return inline. Keep each section tight; the prompts are the product.

```markdown
# Runner Sports & Analytics - [Campaign name] - Flow Campaign Kit
Mode: Prepare | Drive      Date:      Status: DRAFT | READY

## 1. Brief
Goal, audience, offer, CTA, platforms, deadline, sponsor separation. Assumptions stated plainly.

## 2. Concept
One-line idea. Tone. Library component used. Why it fits the brand.

## 3. Cut plan
| # | Shot | Length | Mode | Carries over from | Purpose |

## 4. Ingredients
What is reused or needs creating, and how each is locked (first frame / reference).

## 5. Prompts
### Shot N - [name]
- Flow mode / aspect ratio / length / model tier
- Still prompt (composition lock)
- Video prompt
- Audio line
- If it misses: one concrete variation to try

## 6. Soundtrack (Flow Music)
Prompt, length, structure, instrumental, cut-down plan.

## 7. Flow click-path
Numbered steps for this campaign, from new project to export.

## 8. Assembly and post
Scenebuilder order, music and VO placement, mark / scoreboard / data overlays (with source timestamps), sponsor rail, captions, disclaimer, export settings per platform.

## 9. Captions
Per platform: hook line, body, CTA, hashtags, alt text. No tout language.

## 10. Posting plan
| Date | Platform | Asset/cut | Caption ref | Notes |

## 11. Credits and approvals
Estimated generations, what was read from the UI vs unknown, approvals required before spend and before publishing.

## 12. Decisions needed
Open CONFIRM items, unverified data placeholders, and choices only King Fee can make.
```

Posting-plan notes: give a cadence tied to the slate or event date (teaser, slate preview, live, results). Present posting times as starting points to check against the account's own analytics. Check current destination-platform AI-disclosure rules and Google output-watermarking requirements before publication; do not assert a specific requirement without current official evidence.

## Drive loop (browser sessions only)

Flow's interface changes often; trust what is on screen over anything written here.

1. **Observe.** Confirm the signed-in Google account is the Runner Sports & Analytics account, the project, the selected model tier, aspect ratio, outputs per prompt, and the credit balance. Locate controls by visible labels; never guess selectors or coordinates.
2. **Quote the cost.** Read the credit cost from the UI before generating. When it is not visible, stop and say so rather than estimating.
3. **One bounded action, then look.** Paste the prompt, confirm settings, generate, and inspect the result before the next action. On a timeout, check for existing results before retrying so nothing is generated or charged twice.
4. **Use Flow's own help.** For in-app iteration and "how do I" questions inside the dashboard, use the Flow Agent and built-in tools rather than trial and error in conversation.
5. **Stay in budget.** An approved generation count is a ceiling. Do not upgrade plans, buy credits, or exceed the count.
6. **Stop at the gates.** Sign-in, MFA, CAPTCHA, and permission prompts go back to King Fee. Never work around them.
7. **Report what happened.** Clips generated, where they live in the project, credits actually spent, what is still pending.

## Approval gates

Proceed without asking on: writing prompts, kits, captions, and plans; reading the dashboard; generating within a credit budget King Fee already gave.

Get King Fee's approval before: spending credits with no stated budget; anything paid; publishing or scheduling a public post; sending messages; changing visibility or sharing; uploading unreleased or confidential media or research; placing sponsor content; or using a real person's image or voice. Generating a clip is not approval to publish it.

Do not certify commercial rights or legal clearance for generated video or music; point to the current Google terms and note it as a check for him.

## Closing the response

End with the kit's status in King Fee's standard order, kept short: Outcome, Current State, Risks or Blockers, Decision Required (only if any), Next Move.
