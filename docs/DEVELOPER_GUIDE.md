# MeldSync Developer Guide

This is the quickest way to understand how the codebase is organized and where to make changes without reading the entire build log.

## Purpose of the repo

MeldSync is a local browser proof of concept for reconciling repeated Property Meld export snapshots. The core product value is not file parsing alone; it is the reconciliation workflow:

1. import a snapshot
2. compare it to prior state
3. detect new, changed, stale, and conflicting records
4. preserve user corrections
5. surface the effective operational board

The repo is structured around that workflow, not around a monolithic app shell.

## High-level architecture

The code is intentionally split into a few clear layers:

- UI layer: `src/main.js`
- Domain/reconciliation logic: `src/domain.js`
- Storage layer: `src/storage.js`
- PDF parsing layer: `src/pdfText.js`, `src/pdfOcr.js`
- Demo data and scenario logic: `src/demoData.js`, `src/qa.js`
- Validation and serving scripts: `scripts/*.mjs`
- Test coverage: `tests/*.test.mjs`

## File map

### App entry and UI

- `index.html`
  - Browser entry point.
  - Loads the app and basic page shell.

- `src/main.js`
  - Main user interface rendering.
  - Connects user actions to domain behavior.
  - Handles the public-demo vs owner view state.
  - Renders the board, panels, previews, and warnings.

### Core domain logic

- `src/domain.js`
  - This is the core of the product.
  - Contains the import parser, reconciliation engine, effective-status logic, manual edit helpers, and linked-record behavior.
  - The most important business rules live here.
  - If a behavior is "what counts as a changed record" or "how manual overrides win," it is likely defined here.

- `src/storage.js`
  - Persists the app state in browser storage.
  - Handles restore/backup logic and local data health checks.

### PDF import pipeline

- `src/pdfText.js`
  - Browser-safe text extraction for text-based PDFs.
  - Handles PDF streams and table extraction for supported text exports.

- `src/pdfOcr.js`
  - OCR fallback route for scanned or image-only PDFs.
  - Used when the text-based path is unavailable.

### Demo and scenario-specific logic

- `src/demoData.js`
  - Synthetic demo snapshots used for public-safe testing and walkthroughs.

- `src/qa.js`
  - Demo QA and scenario orchestration.
  - Helps generate a guided demo state and status checks.

- `src/portfolioHandoff.js`
  - Public portfolio route and handoff asset logic.
  - Keeps public-facing portfolio/demo state separate from owner workspace logic.

### Validation and local dev

- `scripts/serve.mjs`
  - Starts the local static preview environment.

- `scripts/validate.mjs`
  - Runs local validation checks and collects issues.

- `package.json`
  - Declares the app scripts and dependencies.
  - Main commands are `start`, `test`, and `validate`.

### Tests

- `tests/reconcile.test.mjs`
  - Core business logic tests for the reconciliation engine.

- `tests/pdfImport.test.mjs`
  - PDF import parser and extraction tests.

## Working on the app

### Start the app locally

```bash
npm install
node scripts/serve.mjs
```

Then open:

```text
http://localhost:4173
```

### Run the tests

```bash
node --test tests/*.test.mjs
```

### Run targeted syntax checks

```bash
node --check src/main.js
node --check src/domain.js
node --check src/pdfText.js
node --check src/pdfOcr.js
node --check scripts/serve.mjs
```

### Run the full validation helper

```bash
node scripts/validate.mjs
```

## Where to make changes

### If you are changing business rules

Look in:

- `src/domain.js`

Examples:

- status normalization
- import reconciliation behavior
- stale record logic
- effective status calculation
- manual override precedence
- history tracking

### If you are changing the UI

Look in:

- `src/main.js`

Examples:

- board rendering
- property panel layout
- filters and controls
- detail drawers
- import preview interactions

### If you are changing browser persistence or restore behavior

Look in:

- `src/storage.js`

Examples:

- local storage structure
- JSON backup/restore
- backup validation
- local owner data health

### If you are changing import parsing

Look in:

- `src/domain.js`
- `src/pdfText.js`
- `src/pdfOcr.js`

Examples:

- CSV schema validation
- PDF text extraction
- OCR fallback behavior
- import normalization rules

### If you are changing demo or public-safe scenarios

Look in:

- `src/demoData.js`
- `src/qa.js`
- `docs/portfolio/`

Examples:

- synthetic data setup
- preset routes
- portfolio handoff assets
- demo QA and walkthrough flows

## Core product contracts

These are the highest-value rules to preserve when making changes:

- repeated identical imports are a safe no-op
- missing records are marked stale rather than deleted
- manual corrections take precedence over import state
- future imports must not silently overwrite manual overrides
- linked records can affect operational status without overwriting the original record's imported/current status
- each meaningful status transition should be recorded in history

If you change reconcile logic, prefer preserving these contracts before optimizing for UI polish.

## Safety boundaries

This repo deliberately keeps private and demo data separated.

Rules:

- never commit real Property Meld export files
- treat public/demo routes as synthetic-only
- keep private-owner controls isolated from public demo state
- preserve the public/private boundary when editing demo or portfolio assets

## Recommended contribution workflow

1. Start with the relevant feature or bug.
2. Identify whether it belongs in the domain layer, UI layer, storage layer, or PDF pipeline.
3. Add or update a targeted test when the behavior is business-critical.
4. Verify the app locally with the repo scripts.
5. Check that public/demo behavior still respects synthetic-only boundaries.

## Good starting points for contributors

If you want to understand the app quickly, read in this order:

1. `README.md` — project summary and local commands
2. `docs/USER_WORKFLOW.md` — how the app is intended to be used
3. `ARCHITECTURE.md` — domain flow and contract notes
4. `src/domain.js` — the engine logic
5. `src/main.js` — the UI integration layer
6. `tests/reconcile.test.mjs` — behavior examples

## Long-term maintainability notes

This repo is a proof of concept, but the domain engine is already the product’s most important abstraction. It is the safest place to keep logic portable and stable.

Good future-proofing decisions include:

- keeping reconciliation logic independent from browser UI code
- separating demo/public logic from owner/private logic
- preserving explicit history entries for status and manual corrections
- keeping test coverage focused on reconciliation correctness

## Summary

If the repo had a single sentence for contributors, it would be:

MeldSync is a reconciliation-first browser app where repeated imports are compared against prior state, manual corrections are protected, and the board reflects the effective current operational reality.

That idea is the center of the codebase. Most feature work should be understood through that lens before editing anything else.






























































































