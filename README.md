# MeldSync

Recurring work order reconciliation and Kanban triage for Property Meld-style CSV exports.

## What It Does

MeldSync turns repeated maintenance CSV exports into operational memory.

It helps answer:

- Which work orders are new since the last export?
- Which records changed status?
- Which records disappeared from the latest export and need verification?
- Which manual corrections should survive future imports?
- Which properties have the oldest unresolved work?
- Which original tickets are effectively resolved by linked follow-up tickets?

## Current POC

This repository currently contains a local browser-based proof of concept.

Built capabilities:

- Strict CSV schema validation
- Property Meld export parsing
- Reconciliation engine
- Idempotent re-import behavior
- Sticky manual status overrides
- Manual/import conflict visibility
- Manual/import conflict queue
- Stale record detection
- Import preview before commit
- Clickable import preview drill-down
- Restore backup preview before commit
- Recent import history
- Import history detail drawer
- Local browser persistence
- JSON backup and restore
- Kanban board by effective status
- Property-level triage panel
- Record notes
- Linked-record effective resolution
- Per-record history
- Synthetic public demo data
- Public demo and owner workspace modes
- In-app demo QA status panel
- Guided demo walkthrough
- Public demo data-boundary notice
- Public demo portfolio snapshot
- Public demo operational brief
- Public demo proof controls
- Aging risk panel
- Public demo proof pack
- Public demo portfolio view
- Public demo portfolio copy pack
- Public demo capture presets
- Portfolio-safe screenshot assets
- Owner production gate

## Data Privacy

The real Property Meld CSV export is private and must not be committed or published.

The public demo uses synthetic data only. The real export filename pattern is ignored by `.gitignore`.

## Access Modes

MeldSync currently has two local POC modes:

- `Public Demo` starts with synthetic data, hides private import/backup/reset controls, and shows only the visitor-safe walkthrough.
- `Owner` uses local browser storage and exposes CSV import, backup, restore, reset, and internal QA checks.

This is a static POC boundary, not production authentication. A hosted product would need backend auth before storing or syncing private data.

## Run Locally

Requirements:

- Node.js 24 or newer

Start the local preview:

```powershell
node scripts/serve.mjs
```

Open:

```text
http://localhost:4173
```

Run tests:

```powershell
node --test tests/*.test.mjs
```

Run syntax checks:

```powershell
node --check src/main.js
node --check src/domain.js
```

Run the full local validation helper:

```powershell
node scripts/validate.mjs
```

## Project Structure

```text
index.html              Browser app entry
src/domain.js           CSV parser and reconciliation engine
src/main.js             UI rendering and local interactions
src/demoData.js         Synthetic demo CSV snapshots
src/qa.js               Demo QA and walkthrough scenario
src/storage.js          Browser localStorage helpers
tests/reconcile.test.mjs Core reconciliation tests
scripts/serve.mjs       Local static preview server
docs/portfolio          Synthetic portfolio screenshot assets
```

## Documentation

- `ROADMAP.md` - build phases and product direction
- `PHASE_STATUS.md` - current completed phase and next blockers
- `ARCHITECTURE.md` - data flow and domain model notes
- `DEMO_STRATEGY.md` - public demo positioning
- `DEPLOYMENT_READINESS.md` - hosted auth and deployment gate
- `QA_CHECKLIST.md` - browser/manual QA checklist
- `GITHUB_HANDOFF.md` - instructions for creating and connecting a GitHub repo
- `BUILD_LOG.md` - detailed phase-by-phase build notes
- `COMMAND_LOG.md` - command, purpose, and outcome tracker

## Current Status

Phase 7A browser QA and UX hardening are complete for the local POC. Phase 7B has started: the public demo / owner workspace boundary is in place, Public Demo clearly labels the workspace as synthetic and private-data-free, and owner import review now supports both pre-commit drill-down and post-commit ledger inspection.
