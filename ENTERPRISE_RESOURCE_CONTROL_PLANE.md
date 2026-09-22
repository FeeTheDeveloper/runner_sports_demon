# Runner Sports / FTD_OS Enterprise Resource Control Plane

Version: 1.0
Status: LOCKED OPERATING INTELLIGENCE
Effective date: 2026-09-22
Owner authority: Fee The Developer / authorized Runner Sports leadership

## Purpose

This document defines how this repository participates in a larger enterprise control plane for authorized SaaS workspaces, identities, agents, subscriptions, quotas, campaign simulations, model providers, browser extensions, remote development, and audit evidence.

The core design rule is:

> Human controls the control plane. The control plane governs authorized identities. Identities consume authorized entitlements. Agents execute workloads. Every material action produces telemetry and an audit record.

This architecture must scale by configuration rather than by redesign. Five users, one thousand users, and one hundred thousand simulated actors must use the same control-plane primitives.

## Non-negotiable distinctions

The system must model these as separate concepts:

- Organization: legal or operating entity.
- Workspace: provider tenant/account owned or administered by an organization.
- Identity: authorized human, agent, service account, or supported machine identity.
- Seat: license assignment.
- Entitlement: provider-granted right to use a feature, quota, credit, promotion, storage allocation, model budget, or API.
- Agent: autonomous or supervised software worker acting through an authorized identity.
- Simulated actor: virtual organizational role used for planning, testing, forecasting, or digital-twin scenarios. It is not represented as a real provider user unless a real authorized identity exists.
- Execution: a real task performed against a provider or internal system.
- Telemetry: usage, latency, cost, quota, result, health, and provenance data produced by execution.

Identity count never implies entitlement count. A workspace may legitimately contain many identities while entitlements remain per-workspace, per-seat, per-user, pooled, promotional, metered, or otherwise provider-defined.

## Resource hierarchy

```text
FTD_OS / enterprise control plane
|
+-- Organization Registry
|   +-- Fee The Developer
|   +-- Runner Sports & Analytics
|   +-- Hutchrok and other explicitly authorized entities
|
+-- Workspace Registry
|   +-- Google Workspace
|   +-- GitHub
|   +-- OpenAI
|   +-- Microsoft
|   +-- model providers
|   +-- advertising platforms
|   +-- cloud and developer SaaS
|
+-- Identity Registry
|   +-- humans
|   +-- AI agents
|   +-- service identities
|   +-- supported automation identities
|
+-- Entitlement Registry
|   +-- seats/licenses
|   +-- API/model credits
|   +-- token quotas
|   +-- storage
|   +-- compute
|   +-- trial/promotional entitlements
|   +-- advertising credits
|
+-- Agent / Worker Registry
|   +-- role
|   +-- permissions
|   +-- model preference
|   +-- budget
|   +-- workload
|   +-- KPI
|   +-- audit history
|
+-- Resource Router
+-- Usage + Cost Ledger
+-- Campaign Simulation Engine
+-- Live Execution Gateway
+-- Evidence / Audit Ledger
```

## Operating modes

Every material record must be explicitly labeled as one of:

- `SIMULATED`: generated for planning, testing, load modeling, campaign modeling, or organizational simulation.
- `SANDBOX`: executed against a provider-supported test/sandbox environment.
- `LIVE`: executed against a real production workspace, provider, campaign, market, or runtime.

Synthetic data must never be presented as live customer, market, advertising, provider, or business performance data.

## Authorized identity scale

This repository must not assume a small fixed user count.

A valid workspace can contain 1, 10, 1000, or more legitimately provisioned identities when the provider and organization permit it. The architecture must support:

- bulk identity registration;
- role and permission assignment;
- tenant separation;
- agent-to-identity binding;
- pooled and per-user quotas;
- per-seat or per-workspace licensing;
- suspension and revocation;
- audit attribution;
- provider-specific policy metadata.

The control plane must never assume that adding an identity creates a new trial, credit, promotion, or quota unless the provider explicitly grants that entitlement.

## Subscription and entitlement intelligence

Every external SaaS/provider resource should be represented in a Subscription & Entitlement Registry with, where available:

- provider;
- owning organization;
- workspace/tenant identifier;
- plan/tier;
- authorized identities;
- seat count;
- billing period;
- entitlement type;
- quota allocation;
- quota remaining;
- API/model token allocation;
- storage/compute allocation;
- legitimate trial or promotional period;
- start/renewal/end dates;
- cancellation deadline;
- rate limits;
- eligible workloads;
- prohibited workloads;
- source/evidence URL or administrative record;
- last verification time;
- status: active, exhausted, suspended, expired, unknown.

The system may optimize around any legitimately granted entitlement, including free tiers, developer programs, startup credits, educational credits, promotional periods, unused seats, and bundled quotas. It must not fabricate identities, misrepresent eligibility, or evade provider restrictions to obtain benefits.

## Provider and model routing

The resource router may choose among multiple authorized providers or models based on:

- task capability;
- model quality;
- cost;
- latency;
- available quota;
- provider health;
- regional or organization policy;
- data sensitivity;
- workload priority;
- budget;
- retry/failover policy.

The router must preserve a per-execution record containing at minimum:

- organization;
- workspace;
- identity;
- agent;
- provider;
- model/tool;
- entitlement used;
- task class;
- execution mode;
- start/end timestamps;
- input/output artifact references;
- usage quantity;
- cost or estimated cost;
- success/failure;
- error class;
- provenance/run id.

## Browser-extension role

Browser extensions are adapters and sensors, not the source of truth.

Approved extension functions include:

- observing which authenticated provider/workspace is active;
- reporting plan/tier and visible quota metadata;
- invoking explicitly approved workflows;
- capturing returned artifacts and provider status;
- forwarding telemetry to the control plane;
- supporting human-in-the-loop approvals;
- operating authenticated business tools where the user is authorized.

Extensions must not become a hidden store for enterprise authority, secrets, or uncontrolled automation.

## Campaign simulation and advertising intelligence

The system may model large campaign ecosystems without creating fake live engagement.

A campaign simulation may include:

- audience segments;
- creative variants;
- copy variants;
- offers;
- budgets;
- channels;
- conversion assumptions;
- funnel stages;
- agent roles;
- attribution scenarios;
- expected ranges;
- Monte Carlo or scenario outputs;
- approval thresholds.

The preferred loop is:

```text
SIMULATE -> SCORE -> APPROVE -> EXECUTE -> OBSERVE -> LEARN -> SIMULATE
```

Only explicitly approved campaign configurations enter LIVE execution.

Real advertising telemetry may include impressions, spend, CPM, CPC, CTR, CPA, ROAS, conversions, quality indicators, timestamps, provider campaign ids, and creative ids. Simulated and live records must remain distinguishable at all times.

The system must not generate fake clicks, impressions, conversions, reviews, or artificial engagement intended to deceive an advertising platform or audience.

## Runner Sports relationship

This repository remains the live sports-intelligence engine.

The enterprise resource-control layer is supporting infrastructure. It may:

- route AI/model workloads used by Runner Sports;
- meter provider/API usage;
- bind Runner agents to authorized identities;
- track quotas and costs;
- run scenario simulations;
- manage extension telemetry;
- support remote developer operations;
- preserve execution evidence.

It must not weaken existing Runner Sports rules for data lineage, live-state verification, model versioning, replay, calibration, or market integrity.

Sports data authority remains defined by `AGENTS.md`, `RUNNER_SYNC_AUDIT.md`, and `ARCHITECTURE.md`.

## Tenant isolation

Default policy is deny-by-default across organizations and workspaces.

A resource owned by one company may be used by another only when an explicit cross-company authorization exists and the provider permits that use.

Required fields for cross-tenant use:

- source organization;
- destination organization;
- resource/workspace;
- approving authority;
- allowed workload;
- effective date;
- expiration/review date;
- cost allocation rule;
- audit reference.

## Remote development control

The development machine is treated as an enterprise dev node rather than a location-bound workstation.

Approved operating pattern:

```text
Phone or remote client
  -> secure remote-development/control layer
  -> Fee The Developer workstation
  -> VS Code / terminal / Git / agents / local runtime
  -> GitHub / cloud / deployment systems
```

Remote control must preserve the same repository, branch, secret, approval, and audit requirements as local operation.

Remote access is a control surface, not a bypass around source control or authorization.

## Usage and cost ledger

Every metered provider integration should support a normalized usage event:

```json
{
  "event_type": "resource_usage",
  "mode": "LIVE",
  "organization_id": "runner_sports",
  "workspace_id": "provider_workspace",
  "identity_id": "authorized_identity",
  "agent_id": "agent_or_human",
  "provider": "provider_name",
  "service": "model_or_tool",
  "entitlement_id": "entitlement_reference",
  "units": 0,
  "unit_type": "tokens|requests|minutes|credits|gb|seat_days|other",
  "estimated_cost": 0,
  "currency": "USD",
  "started_at": "ISO-8601",
  "completed_at": "ISO-8601",
  "run_id": "stable-run-id",
  "status": "success|failure|partial"
}
```

## Evidence and audit requirements

Material control-plane decisions must be reconstructable.

Preserve:

- who/what initiated the task;
- owning organization;
- workspace and identity;
- authorization path;
- entitlement consumed;
- provider/model/tool selected;
- input artifact references;
- output artifact references;
- timestamps;
- usage/cost;
- approval state;
- simulation/sandbox/live state;
- provider response/error;
- code commit/build version when applicable.

## Mandatory safety and platform controls

The following are hard boundaries:

- no credential sharing outside approved secret-management paths;
- no committed secrets;
- no fake identities represented as real people;
- no automated creation of identities for the purpose of evading per-user/per-org limits;
- no repeated trial/promotion farming when eligibility is not granted;
- no artificial advertising engagement;
- no fabricated performance data;
- no cross-tenant resource use without explicit authorization;
- no hidden auto-wagering/trading;
- no bypass of provider rate limits or access controls.

## Intelligence lock

All coding agents operating in this repository must treat this document as required architecture context whenever work touches:

- external SaaS;
- browser extensions;
- agent identities;
- workspace users;
- subscriptions;
- quotas;
- credits;
- trials/promotions;
- model routing;
- campaign simulation;
- live campaign execution;
- remote development;
- usage metering;
- enterprise orchestration.

Implementation changes affecting these areas require synchronized updates to the machine-readable policy under `.runner/resource-control-plane.json` and, when material, `RUNNER_SYNC_AUDIT.md`.
