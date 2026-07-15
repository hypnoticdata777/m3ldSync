# MeldSync Architecture

## Current POC Architecture

The first POC is a local browser application with no external services.

Components:

- `index.html` loads the app.
- `src/main.js` renders the interface and handles user actions.
- `src/domain.js` contains the import parser, reconciliation engine, status rules, and manual edit helpers.
- `src/demoData.js` contains synthetic demo CSV snapshots.
- `src/storage.js` persists local state in browser storage.
- `tests/reconcile.test.mjs` validates the highest-risk business logic.

## Data Flow

1. A CSV snapshot is loaded.
2. The parser validates required columns.
3. Rows are normalized into internal import records.
4. The reconciliation engine compares import records to stored records.
5. The engine returns updated state and an import batch summary.
6. The UI displays:
   - Kanban columns
   - Property summary
   - Filters
   - Record details
   - History
7. Manual status, note, and link edits are persisted locally.

## Core Contract

The reconciliation engine is the core product contract.

It must preserve these guarantees:

- A repeated identical import is a safe no-op.
- Missing records are marked stale, not deleted.
- Manual status corrections are authoritative.
- Future imports may log discrepancies but must not silently overwrite manual corrections.
- Each meaningful status transition is recorded in history.
- Linked records can affect operational status without overwriting the original record's imported/current status.

## Effective Status

Records now have two useful status concepts:

- `currentStatus`: the authoritative record status, with manual override winning over import.
- `effectiveStatus`: the status the operations board should use after linked-record resolution.

If an original ticket is still pending but is linked to a completed or canceled follow-up, the original can be treated as effectively closed in the board and property counts. The original status is not erased; the detail panel still shows both import/current status and effective status.

## Public Demo Boundary

Public demo state must be synthetic.

The public demo may reuse:

- CSV column names
- Status vocabulary
- Priority vocabulary
- General workflow patterns

The public demo must not reuse:

- Real property names
- Real unit identifiers
- Real tenant/vendor information
- Real descriptions
- Real import files

## Future Production Architecture

When the POC graduates from local validation to durable private use, the likely architecture is:

- React + TypeScript frontend
- Supabase Auth for SuperAdmin access
- Supabase Postgres for private records, history, and import batches
- Row-level security to separate real private data from public demo data
- Synthetic public seed data
- CSV import still routed through the same reconciliation engine

## Why the Engine Is Isolated

The engine is intentionally independent from the UI and storage layer. This keeps the most important logic portable across:

- Local browser POC
- React app
- FastAPI backend
- Supabase Edge Function
- Future source-system API integration
