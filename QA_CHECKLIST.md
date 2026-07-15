# MeldSync QA Checklist

Use this checklist before relying on the private tool day to day or publishing a public demo.

## Environment

- [ ] Local preview opens at `http://localhost:4173`.
- [ ] Browser console has no uncaught errors on initial load.
- [ ] App starts in Demo Data mode.
- [ ] Real CSV file is not part of committed source.

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

- [ ] Click `Import CSV`.
- [ ] Select a Property Meld export.
- [ ] Confirm app switches to Private Local Data only after commit.
- [ ] Confirm import preview appears before commit.
- [ ] Confirm canceling does not commit private data.
- [ ] Confirm committing stores data locally.
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

- [ ] Check desktop width.
- [ ] Check tablet/narrow browser width.
- [ ] Check mobile-width browser.
- [ ] Confirm no text overlaps.
- [ ] Confirm board remains scrollable.
- [ ] Confirm detail panel remains usable.

## Public Demo Safety

- [ ] Demo mode contains synthetic data only.
- [ ] No real property names appear in screenshots.
- [ ] No real unit identifiers appear in screenshots.
- [ ] No real descriptions appear in screenshots.
- [ ] Public demo copy clearly indicates demo data.

