# MeldSync Roadmap

## Product Direction

MeldSync should be built as one application with two clearly separated operating modes:

1. Private Ops Mode for the real single-user tool Carlos uses with real maintenance CSV exports.
2. Public Demo Mode for portfolio visitors, using synthetic prefilled data only.

This keeps the project honest as a practical internal tool while still making it safe and polished enough to showcase publicly.

## Current Progress

As of 2026-07-15, the project has completed the local POC through Phase 6:

- CSV parser
- Reconciliation engine
- Local persistence
- Kanban UI
- Import preview
- Backup/restore
- Manual overrides
- Linked-record effective resolution
- Import history/auditability
- GitHub handoff documentation

Current next phase: Phase 7A - browser QA and UX hardening.

## Recommended Access Model

### SuperAdmin

The SuperAdmin account is for Carlos only.

Capabilities:

- Import real Property Meld CSV exports.
- Persist real reconciled work orders locally or in a private backend.
- Edit manual statuses, notes, and linked records.
- View full history and import batches.
- Reset local/private data when needed.
- Export synthetic demo fixtures derived from the schema, not from real tenant data.

### Public Demo User

Public demo users should not authenticate with real credentials in the first POC. They should enter a sandbox demo session.

Capabilities:

- See prefilled synthetic work orders.
- Upload a synthetic or user-provided CSV in the same schema.
- Try reconciliation, filtering, Kanban, notes, manual overrides, and history.
- Reset the demo dataset.

Restrictions:

- No access to real records.
- No shared persistence across visitors.
- No ability to call private import history.
- No real property, tenant, owner, vendor, or unit identifiers.

## Data Privacy Rule

The real CSV must never ship with the public app, demo repo, portfolio site, screenshots, seed files, or test fixtures.

Public fixtures should be generated with realistic but fake values:

- Synthetic property names
- Synthetic units
- Fake descriptions
- Realistic statuses
- Realistic priorities
- Realistic dates
- Same CSV headers as the source export

## Phase 0: Project Setup

Goal: establish the app foundation.

Deliverables:

- React + TypeScript + Vite app
- Local development scripts
- Basic routing
- Test runner
- Lint/typecheck setup
- Initial design system tokens
- Git repo initialized locally

Definition of done:

- App runs locally.
- Tests run locally.
- No real CSV data is committed.

## Phase 1: CSV Contract and Parser

Goal: convert Property Meld CSV exports into normalized app records.

Source CSV columns:

- Meld Number
- Unit
- Property Name
- Work Category
- Work Type
- Description
- Priority
- Meld Status
- Meld creation date
- Meld completion date
- Total Labor Hours

Deliverables:

- CSV parser
- Schema validation
- Clear errors for missing or renamed columns
- Date parsing
- Record normalization
- Closed/open status classification
- Synthetic CSV fixture with the same schema

Definition of done:

- The importer accepts the real export shape.
- The importer rejects invalid CSVs with readable errors.
- Tests cover valid import, missing columns, blank unit, blank completion date, and unknown status.

## Phase 2: Reconciliation Engine

Goal: prove the load-bearing business logic before the UI depends on it.

Deliverables:

- Pure function: reconcile(previousState, importRows, importBatch)
- New record detection
- Status change detection
- Stale record detection
- Idempotent re-import behavior
- Sticky manual override behavior
- Import batch summary
- Status history generation

Definition of done:

- Re-importing the same CSV produces zero duplicate records and zero spurious history.
- Manual status overrides survive future imports.
- Missing records are marked stale, not deleted.

## Phase 3: Local Persistence

Goal: make the tool usable without a backend.

Deliverables:

- Browser persistence using IndexedDB or localStorage
- Import batch storage
- Record storage
- History storage
- Reset private data action
- Reset demo data action

Definition of done:

- Imported data survives page refresh.
- Manual notes and status overrides survive page refresh.
- Demo data can be reset cleanly.

## Phase 4: Core App UI

Goal: build the daily-use operations screen.

Deliverables:

- Kanban board grouped by Meld Status/currentStatus
- Card fields: meld number, property, unit, category, description, priority, days open, stale flag
- Property overview panel
- Search by property, unit, ID, and description
- Priority/status filters
- Toggle closed columns
- Import summary panel

Definition of done:

- Carlos can import a CSV and triage records from the board.
- Public demo users can understand the workflow in under one minute.

## Phase 5: Manual Corrections

Goal: protect human-verified truth from being overwritten by imports.

Deliverables:

- Manual status control
- Notes editor
- Linked record field
- Clear visual distinction between import status and manual authoritative status
- History entries for manual changes
- Discrepancy logging when an import conflicts with a manual override

Definition of done:

- A manually completed record remains completed even if a later CSV says it is still pending.
- The UI explains the discrepancy through history, not by overwriting the manual decision.

## Phase 6: History and Auditability

Goal: make the tool trustworthy.

Deliverables:

- Record detail drawer
- Status timeline
- Import batch timeline
- Source labels: import or manual
- First seen / last seen / stale state
- Linked record display

Definition of done:

- For any card, Carlos can answer: when did this appear, what changed, who/what changed it, and why is it in this column?

## Phase 7: Public Portfolio Demo

Goal: turn the tool into a safe, polished showcase.

Deliverables:

- Demo mode with synthetic preloaded dataset
- Demo import sample
- Public-safe screenshots
- In-app mode indicator: Demo Data
- Privacy-safe copy
- Reset demo button
- Optional guided sample scenario

Definition of done:

- The public version demonstrates the reconciliation engine, Kanban workflow, sticky manual overrides, and history view without exposing real data.

## Phase 8: SuperAdmin / Auth Layer

Goal: separate private use from public demo access.

Recommended first version:

- Public visitors use Demo Mode without login.
- Carlos uses a private local build or protected route.

Later production version:

- Supabase Auth or equivalent
- SuperAdmin role
- Demo role
- Row-level access rules
- Private database for real imports
- Public synthetic seed data only

Definition of done:

- Real data is only accessible to SuperAdmin.
- Demo users can never reach real import batches or records.

## Phase 9: Hardening

Goal: make the tool reliable enough for repeated operational use.

Deliverables:

- Edge-case tests
- Large CSV performance check
- Schema drift handling
- Import preview before commit
- Duplicate import safeguards
- Backup/export JSON
- Restore from backup JSON

Definition of done:

- The tool can handle 1,000-2,000 records without noticeable lag.
- Destructive or bulk actions require confirmation.
- Data can be backed up before relying on the tool day to day.

## Phase 10: Future Enhancements

Potential v2 features:

- Aging reports
- Average days-to-close by category
- Property-level trend charts
- Vendor/category bottleneck analysis
- Export filtered board to CSV
- Direct source-system API integration
- Multi-user roles
- Notifications

## Build Order Recommendation

Build in this order:

1. Project setup
2. CSV parser
3. Reconciliation engine
4. Tests
5. Local persistence
6. Kanban UI
7. Manual override UI
8. History drawer
9. Synthetic public demo mode
10. Auth/SuperAdmin separation

The reason to delay auth is simple: the core value of MeldSync is the reconciliation behavior. Auth protects the product, but reconciliation is the product.
