# MeldSync QA Checklist

Use this checklist before relying on the private tool day to day or publishing a public demo.

## Environment

- [x] Local preview opens at `http://localhost:4173`.
- [ ] Browser console has no uncaught errors on initial load.
- [x] App starts in Demo Data mode.
- [ ] Real CSV file is not part of committed source.
- [x] Demo QA panel shows all checks passing.

## Automated Smoke Checks

These are covered by `src/qa.js` and `tests/qa.test.mjs`.

- [x] Demo baseline parses.
- [x] Demo follow-up identifies new, changed, and stale records.
- [x] Cancel-safe state remains unchanged before commit.
- [x] Commit state contains expected follow-up records and imports.
- [x] Manual override survives a later import.
- [x] Linked record resolution works.
- [x] Backup-shaped state remains serializable.

## Demo Import Flow

- [ ] Click `Load Demo Baseline`.
- [ ] Confirm board shows synthetic records only.
- [ ] Click `Run Demo Follow-Up Import`.
- [ ] Confirm an Import Preview panel appears.
- [ ] Confirm preview shows rows, new, changed, stale, manual conflicts, and total after.
- [ ] Confirm preview lists affected record IDs with property and status context.
- [ ] Click `Cancel`.
- [ ] Confirm no import is committed.
- [ ] Run follow-up import again.
- [ ] Click `Commit Import`.
- [ ] Confirm board counts update.
- [ ] Confirm recent import history ledger updates.

## Private CSV Import Flow

- [x] Click `Import CSV`.
- [x] Select a Property Meld export.
- [x] Confirm import preview appears before commit.
- [x] Confirm app switches to Private Local Data after commit.
- [ ] Confirm canceling does not commit private data.
- [x] Confirm committing stores data locally.
- [ ] Refresh page.
- [ ] Confirm private data persists locally.

## Reconciliation Behavior

- [ ] Re-import the same CSV.
- [ ] Confirm zero new records.
- [ ] Confirm zero spurious status history entries.
- [ ] Import a changed CSV.
- [ ] Confirm changed records appear in preview.
- [ ] Confirm absent records are marked stale, not deleted.

## Manual Override Behavior

- [ ] Select a pending card.
- [ ] Change status manually to `Completed`.
- [ ] Confirm Manual badge appears.
- [ ] Re-import a CSV where the source still shows the item pending.
- [ ] Confirm manual status survives.
- [ ] Confirm discrepancy is visible through history or preview.

## Linked Record Behavior

- [ ] Import or use data containing one pending original and one closed follow-up.
- [ ] Enter the follow-up Meld Number in the original record's linked-record field.
- [ ] Confirm linked record summary appears.
- [ ] Confirm effective status changes to the linked closed status.
- [ ] Confirm original card shows `Linked resolved`.
- [ ] Confirm open counts and property counts no longer treat the original as open.

## Backup and Restore

- [ ] Click `Export Backup`.
- [ ] Confirm JSON file downloads.
- [ ] Reset local data.
- [ ] Click `Restore Backup`.
- [ ] Select downloaded JSON backup.
- [ ] Confirm restored state matches the prior state.

## Responsive Layout

- [x] Check desktop width.
- [ ] Check tablet/narrow browser width.
- [ ] Check mobile-width browser.
- [x] Confirm no obvious desktop text overlaps from screenshot review.
- [x] Confirm board remains scrollable.
- [x] Confirm detail panel remains usable.

## Public Demo Safety

- [ ] Demo mode contains synthetic data only.
- [ ] No real property names appear in screenshots.
- [ ] No real unit identifiers appear in screenshots.
- [ ] No real descriptions appear in screenshots.
- [ ] Public demo copy clearly indicates demo data.

## Manual QA Evidence

2026-07-15 screenshot review confirmed:

- Local app loads at `localhost:4173`.
- Private CSV import preview appears with 502 rows.
- Real CSV commit produces the operational Kanban board.
- Property list, board columns, and detail panel render on desktop.
- Demo QA panel shows passing checks.

Important: screenshots from the real CSV import contain real property/unit/work-order details and must not be used for public portfolio materials.
