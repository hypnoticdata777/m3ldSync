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
- [x] Confirm affected record IDs can be clicked to inspect current committed status versus pending import status.
- [x] Click `Cancel`.
- [x] Confirm no import is committed.
- [x] Run follow-up import again.
- [x] Click `Commit Import`.
- [x] Confirm board counts update.
- [x] Confirm recent import history ledger updates.
- [x] Confirm committed import batches can be selected and inspected.
- [x] Confirm affected IDs in the import history detail select the matching work order.

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
- [x] Confirm manual status survives.
- [x] Confirm discrepancy is visible through history or preview.
- [x] Confirm discrepancy is visible in the selected record detail panel.

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
- [x] Confirm Restore Preview appears before local state is replaced.
- [x] Confirm canceling Restore Preview preserves current local state.
- [x] Confirm committing Restore Preview replaces local state.
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
- [x] Owner mode shows hosted-auth Production Gate.
- [x] Public Demo shows a synthetic portfolio snapshot.
- [x] Public Demo shows an operational brief.
- [x] Public Demo shows sticky manual and linked-resolution proof controls.
- [x] Aging Risk ranks property focus areas.
- [x] Public Demo shows a portfolio-safe proof pack.
- [x] Public Demo Portfolio View shows clean screenshot surfaces.
- [x] Public Demo Portfolio Copy shows reusable synthetic-safe snippets.
- [x] Public Demo Capture Presets stage screenshot proof states.
- [x] Portfolio-safe screenshots are captured from synthetic Public Demo only.
- [x] No real property names appear in captured public screenshots.
- [x] No real unit identifiers appear in captured public screenshots.
- [x] No real descriptions appear in captured public screenshots.

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

2026-07-20 Phase 7B proof controls confirmed:

- Sticky Manual Proof selects `MS-1001`, keeps effective status completed, and shows `Manual 1`.
- Linked Resolution Proof selects `MS-1001`, links it to `MS-1002`, and shows `Linked resolved 1`.
- Owner mode does not show the public proof controls.

2026-07-20 Phase 7B aging risk confirmed:

- Aging Risk ranks properties by active work, high priority, stale count, and oldest open age.
- During synthetic follow-up preview, Maple Court moves to the top with `2 open`, `1 high priority`, and `1 stale`.
- The panel remains usable in Owner mode and at mobile width.

2026-07-20 Phase 7B proof pack confirmed:

- Public Demo shows a proof pack with reconciliation, verification, manual memory, linked resolution, top focus, and data boundary evidence.
- The proof pack updates from baseline to synthetic follow-up preview state.
- Owner mode does not show the public proof pack.

2026-07-20 Phase 7B portfolio view confirmed:

- Portfolio View hides toolbar, workflow board, import preview panel, walkthrough, and import ledger.
- Portfolio View keeps Public Demo Snapshot, Operational Brief, Aging Risk, and Demo Proof Pack visible.
- Full Demo restores the interactive workflow.
- Owner mode does not show the Portfolio View toggle.
- Mobile Portfolio View has no page-level horizontal overflow.

2026-07-20 Phase 7B portfolio copy confirmed:

- Public Demo shows Short Summary, Proof Bullets, and Privacy Caption snippets.
- Copy buttons update to `Copied` after activation.
- Follow-up preview updates proof bullets to `1 new, 2 changed, 1 stale` and Maple Court top focus.
- Copy state clears when the generated text changes.
- Owner mode does not show the Portfolio Copy pack.
- Mobile Portfolio Copy has no page-level horizontal overflow.

2026-07-20 Phase 7B capture presets confirmed:

- Portfolio View shows Capture Presets for Baseline, Follow-Up Signal, Sticky Manual, and Linked Resolution.
- Follow-Up Signal updates public proof surfaces to `1 new / 2 changed / 1 stale` without showing the import preview panel.
- Sticky Manual updates public proof surfaces to `1 sticky`.
- Linked Resolution updates public proof surfaces to `1 resolved`.
- Owner mode does not show Capture Presets.
- Mobile Capture Presets have no page-level horizontal overflow.

2026-07-20 Phase 7B screenshot assets confirmed:

- Captured `docs/portfolio/meldsync-portfolio-hero.png`.
- Captured baseline, follow-up signal, sticky manual, and linked-resolution Portfolio View screenshots.
- Capture checks confirmed Public Demo mode, Portfolio View, synthetic notice, hidden owner controls, and no page-level horizontal overflow.
- Screenshot manifest is stored at `docs/portfolio/README.md`.

2026-07-20 Phase 7B production gate confirmed:

- Owner mode shows a Production Gate with hosted auth deferred, owner data local-only, public demo safe, and auth design as the next gate.
- Public Demo does not show the Production Gate.
- Deployment readiness note is stored at `DEPLOYMENT_READINESS.md`.

2026-07-20 Owner restore preview confirmed:

- Selecting a synthetic JSON backup opens an in-app Restore Preview instead of a native confirmation.
- Cancel preserves the current 7-record owner/demo state.
- Restore Backup commits the selected backup and replaced the workspace with the selected 0-record synthetic backup.
- Reset Local Data restored the 6-record synthetic demo baseline after the test.
- Mobile Restore Preview has no page-level horizontal overflow.

2026-07-20 manual conflict visibility confirmed:

- Sticky Manual Proof selects `MS-1001` and shows a Verification Conflict panel.
- The panel explains that the latest import reports `Pending completion` while the owner-verified status remains `Completed`.
- Showing closed cards displays the `Conflict` badge on the affected card.
- Mobile conflict detail has no page-level horizontal overflow.

2026-07-20 import preview drill-down confirmed:

- Synthetic follow-up import auto-selects the first affected record, `MS-1007`, and shows it as `New`.
- Clicking `MS-1001` updates the inspector to `Changed`, with committed status `Pending vendor acceptance` and import status `Pending completion`.
- Clicking `MS-1004` updates the inspector to `Stale`.
- Desktop and `390x844` mobile checks showed no page-level horizontal overflow.

2026-07-20 import history detail confirmed:

- Committing the synthetic follow-up import auto-selects the latest import history batch.
- Selecting `demo-baseline` opens baseline details with historical imported statuses.
- Selecting the follow-up batch shows `1 new`, `2 changed`, `1 stale`, and `3` import history entries.
- Clicking `MS-1001` in the selected batch detail selects the matching work card and detail panel.
- Desktop and `390x844` mobile checks showed no page-level horizontal overflow.
