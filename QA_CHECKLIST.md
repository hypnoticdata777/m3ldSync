# MeldSync QA Checklist

Use this checklist before relying on the private tool day to day or publishing a public demo.

## Environment

- [x] Local preview opens at `http://localhost:4173`.
- [ ] Browser console has no uncaught errors on initial load.
- [x] App starts in Demo Data mode.
- [ ] Real CSV file is not part of committed source.
- [x] Demo QA panel shows all checks passing.
- [x] Owner Demo Walkthrough panel shows seven ready steps.

## Automated Smoke Checks

These are covered by `src/qa.js` and `tests/qa.test.mjs`.

- [x] Demo baseline parses.
- [x] Demo follow-up identifies new, changed, and stale records.
- [x] Cancel-safe state remains unchanged before commit.
- [x] Commit state contains expected follow-up records and imports.
- [x] Manual override survives a later import.
- [x] Linked record resolution works.
- [x] Backup-shaped state remains serializable.
- [x] Walkthrough steps map to automated QA checks.

## Demo Import Flow

- [x] Click `Load Demo Baseline`.
- [x] Confirm board shows synthetic records only.
- [x] Click `Run Demo Follow-Up Import`.
- [x] Confirm an Import Preview panel appears.
- [x] Confirm preview shows rows, new, changed, stale, manual conflicts, and total after.
- [x] Confirm preview lists affected record IDs with property and status context.
- [x] Click `Cancel`.
- [x] Confirm no import is committed.
- [x] Run follow-up import again.
- [x] Click `Commit Import`.
- [x] Confirm board counts update.
- [x] Confirm recent import history ledger updates.

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

- [x] Select a pending card.
- [x] Change status manually.
- [x] Confirm Manual badge/count appears.
- [ ] Re-import a CSV where the source still shows the item pending.
- [ ] Confirm manual status survives.
- [ ] Confirm discrepancy is visible through history or preview.

## Linked Record Behavior

- [x] Import or use data containing one pending original and one closed follow-up.
- [x] Enter the follow-up Meld Number in the original record's linked-record field.
- [x] Confirm linked record summary appears.
- [x] Confirm effective status changes to the linked closed status.
- [x] Confirm original card shows `Linked resolved`.
- [x] Confirm open counts and property counts no longer treat the original as open.

## Backup and Restore

- [x] Click `Export Backup`.
- [x] Confirm JSON file downloads.
- [x] Reset local data.
- [x] Click `Restore Backup`.
- [x] Select a JSON backup.
- [x] Confirm restored state matches the selected backup.
- [ ] Confirm a downloaded export backup can be restored round-trip.

## Responsive Layout

- [x] Check desktop width.
- [x] Check tablet/narrow browser width.
- [x] Check mobile-width browser.
- [x] Confirm no obvious desktop text overlaps from screenshot review.
- [x] Confirm no page-level horizontal desktop overflow.
- [x] Confirm board remains scrollable.
- [x] Confirm detail panel remains usable.

## Public Demo Safety

- [x] Demo mode contains synthetic data only.
- [x] Public Demo hides private CSV import.
- [x] Public Demo hides backup, restore, and reset controls.
- [x] Public Demo hides internal QA panel.
- [x] Public Demo shows visitor-safe walkthrough steps only.
- [x] Public demo copy clearly indicates demo data.
- [x] Public Demo shows a synthetic portfolio snapshot.
- [x] Public Demo shows an operational brief.
- [ ] No real property names appear in screenshots.
- [ ] No real unit identifiers appear in screenshots.
- [ ] No real descriptions appear in screenshots.

## Manual QA Evidence

2026-07-15 screenshot review confirmed:

- Local app loads at `localhost:4173`.
- Private CSV import preview appears with 502 rows.
- Real CSV commit produces the operational Kanban board.
- Property list, board columns, and detail panel render on desktop.
- Demo QA panel shows passing checks.

Important: screenshots from the real CSV import contain real property/unit/work-order details and must not be used for public portfolio materials.

2026-07-18 browser automation confirmed:

- Synthetic demo baseline loads at `localhost:4173`.
- Demo QA and Demo Walkthrough panels both show `7/7`.
- Demo follow-up preview/cancel/commit flow works.
- Manual status and note edits persist after reload.
- Linked-record resolution works with synthetic IDs and updates effective status/counts/card badge.
- Desktop page-level horizontal overflow was found and fixed.

2026-07-20 browser automation confirmed:

- `Reset Local Data` opens an inline reset confirmation panel instead of a native dialog.
- `Keep Current Data` closes the panel and preserves the committed 7-record demo follow-up state.
- `Confirm Reset` clears local owner storage and reloads the 6-record synthetic demo baseline.
- Restore Backup opens the file picker and accepts a synthetic JSON backup.
- Restore replaced local state with the selected synthetic backup and produced no console errors.
- Tablet and mobile checks passed at `820x900` and `390x844` with no page-level horizontal overflow.
- Manual Windows check confirmed `Export Backup` downloads JSON files.

2026-07-20 Phase 7B polish confirmed:

- Public Demo shows a synthetic-data notice and continues to hide private owner controls.
- Owner mode shows a local-browser storage notice next to owner controls.
- Desktop and mobile checks for the notices produced no page-level overflow and no console errors.

2026-07-20 Phase 7B investor snapshot confirmed:

- Public Demo shows a synthetic portfolio snapshot with portfolio scope, open work, latest import, and private-surface status.
- Owner mode does not show the Public Demo Snapshot.
- Desktop and mobile checks for the snapshot produced no page-level overflow and no console errors.

2026-07-20 Phase 7B operational brief confirmed:

- Public Demo shows import signal, triage focus, verification queue, and human-correction counts.
- The brief updates to `1 new, 2 changed, 1 stale` during synthetic follow-up import preview and stays consistent after commit.
- Owner mode does not show the public Operational Brief.
