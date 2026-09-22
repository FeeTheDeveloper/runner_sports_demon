# Resource Control Lock Handoff — 2026-09-22

## Decision

Runner Sports Demon now participates in the Fee The Developer enterprise resource-control architecture.

## Locked principles

1. Authorized workspace identity scale is supported by configuration, not hard-coded assumptions.
2. Identity, seat, entitlement, agent, simulated actor, and execution are separate primitives.
3. Simulated organizational scale does not require equivalent real SaaS identities.
4. Real SaaS identities are allowed at whatever scale the organization and provider legitimately authorize.
5. Entitlements are provider-defined and must be independently tracked.
6. Browser extensions are adapters/sensors/operators; the control plane is authoritative.
7. Campaign intelligence uses SIMULATED, SANDBOX, and LIVE states with hard provenance separation.
8. Resource routing may optimize cost, quota, quality, latency, and provider health.
9. Remote VS Code/workstation access is part of the operating model and must preserve repository controls.
10. Every material provider execution should produce usage, cost, provenance, and audit telemetry.

## Required implementation direction

Future engineering may add:

- normalized organization/workspace/identity/entitlement schemas;
- subscription discovery and renewal monitoring;
- agent-to-identity binding;
- model/provider routing;
- extension telemetry ingestion;
- campaign simulation registries;
- usage/cost ledgers;
- resource dashboards;
- remote dev-node health;
- policy-validation tests.

## Boundaries

Do not build identity farms, promotion/trial evasion, fake advertising engagement, fabricated live metrics, cross-tenant credential leakage, rate-limit bypass, or secret persistence in repository files.

See `ENTERPRISE_RESOURCE_CONTROL_PLANE.md` and `.runner/resource-control-plane.json`.
