# Runner Coordination

`.runner/handoffs/` contains versioned JSON work handoffs.
`.runner/work/` contains active claims before shared-component edits.
`.runner/system-status.json` is the compact machine-readable system state.

Claims and handoffs must not contain credentials or raw secrets. A handoff is complete only when its artifact exists, validates against a contract, has consumer confirmation, and records version and lineage.
