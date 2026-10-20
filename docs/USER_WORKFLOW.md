# MeldSync User Workflow and Quickstart

This guide is the shortest path to understanding how MeldSync is meant to be used. If you only read one workflow doc, read this one.

## What MeldSync does

MeldSync compares repeated Property Meld export snapshots and turns the differences into a usable operations board.

The workflow is intentionally simple:

1. Import a snapshot.
2. Review what changed.
3. Fix any manual corrections.
4. Keep using the board as the source of truth for operational triage.

## Modes

MeldSync currently runs in two local modes:

- Public Demo: safe synthetic data only; no private import or backup controls.
- Owner: private local workspace for real CSV/PDF imports, backups, and QA checks.

The app is a local proof of concept, not a production authentication system. The boundary matters: the public demo is intentionally stripped down to avoid exposing private operational data.

## Quickstart

### 1. Start the app

From the repo root:

```bash
npm install
node scripts/serve.mjs
```

Then open:

```text
http://localhost:4173
```

### 2. Choose the right mode

- Use Public Demo if you want to explore the UI without private data.
- Use Owner mode if you are validating real data imports and local backup workflows.

### 3. Import a snapshot

The app accepts:

- CSV exports
- Text-based PDF exports
- Scanned/image-only PDFs with OCR fallback

The import flow validates the schema first. If the file is missing required columns or has a format mismatch, you get a clear failure before the import is committed.

### 4. Review the import preview

Before commit, the system shows what the import would do:

- new records
- changed records
- stale records
- manual conflict warnings
- linked-record effects

This is the key concept in MeldSync: the product is not just a parser; it is a reconciliation and decision workflow.

### 5. Resolve conflicts and manual corrections

The reconciliation engine preserves manual decisions so they do not get silently overwritten by a later import. This includes:

- manual status updates
- notes
- operational overrides
- linked follow-up resolution

If a later import disagrees with a manual correction, the app makes that conflict visible instead of hiding it.

### 6. Use the board as operational memory

Once imported, the board helps answer:

- which records are new?
- which records changed status?
- which records are stale or missing?
- which work orders are aging?
- which original tickets are effectively resolved by linked follow-up items?

This is the primary value of the product: every repeated export becomes a timeline of operational state rather than a disconnected spreadsheet.

## Core workflow in practice

A typical user journey looks like this:

1. Import last week's Property Meld export.
2. Review the import preview.
3. Confirm new and changed records.
4. Fix or verify any manual overrides.
5. Use the Kanban/effective-status view to triage work.
6. Repeat on the next export.

The important thing is that MeldSync is designed around repeated imports, not one-off file processing.

## What to look at first in the UI

If you are new to the app, focus on these areas in order:

1. Import and validation status
2. Import preview / conflict queue
3. Record detail panel
4. Effective status board
5. Property-level triage panel
6. History and backup controls

## Why manual overrides matter

A later CSV import should never silently erase a human correction.

MeldSync preserves the idea that:

- imported data is an update signal
- manual status edits are authoritative when they are intentional
- historical changes remain visible in record history
- a linked follow-up may resolve an original record operationally without deleting the original record record itself

This is a core product contract and one of the main reasons the reconciliation engine exists.

## Common operational questions this workflow answers

- Which work orders need attention now?
- Which records are still unresolved from previously imported snapshots?
- Which records were manually adjusted and should be reviewed against the latest import?
- Which follow-up records should cause the original work order to be treated as effectively closed?
- What changed since the last export?

## Best practice

For private owner usage, keep a local backup after each meaningful import cycle. This makes it easier to confirm what changed and restores a safe point if a later import introduces confusion.

## Documentation map

For deeper context, see:

- `README.md` for repo-level overview and local run instructions
- `ARCHITECTURE.md` for the domain model and data flow
- `ROADMAP.md` for product direction
- `QA_CHECKLIST.md` for manual validation guidance

This user guide is the easiest entry point for understanding the intent of the app before diving into deeper technical design docs.
