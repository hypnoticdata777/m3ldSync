# MeldSync Build Log

This log tracks what was built, what worked, what did not, and what we learned.

## 2026-07-15 - Phase 0 Start: Local POC Foundation

### Goal

Start the local proof of concept for MeldSync as both:

- A private operations tool for real CSV reconciliation.
- A public portfolio demo that uses synthetic data only.

### Decisions

- Build locally first.
- Keep real CSV data out of public demo assets.
- Use a calm, scan-friendly operational UI.
- Avoid purple-heavy styling.
- Maintain detailed documentation from the beginning.

### Good

- Product spec is detailed enough to start implementation.
- Real CSV schema has been inspected and maps cleanly to the product model.
- `Meld Number` is unique and stable in the sample export.
- Status values are finite and easy to classify as open or closed.

### Bad / Risks

- Public demo must not include the real CSV or real property/unit data.
- Authentication should not be treated as the first milestone; the core reconciliation logic must be proven first.
- Future CSV schema drift could silently corrupt data unless validation is strict.

### I Did Not Know This Yet

- Whether the final private version will remain browser-local or move to Supabase.
- Whether future exports always contain the same 11 columns.
- Whether Property Meld exports ever duplicate `Meld Number` across cloned/follow-up tickets.

### Outcome

Phase 0 documentation started. Next step is scaffolding the local app and core reconciliation code.

## 2026-07-15 - Phase 0-4 First Working Slice

### Goal

Create the first local MeldSync POC slice with a working browser interface, synthetic demo data, CSV parsing, reconciliation logic, and tests.

### Built

- Local dependency-free browser app shell.
- Privacy-focused `.gitignore` that excludes private Property Meld exports.
- Strict Property Meld CSV parser.
- Reconciliation engine with:
  - New record detection
  - Status change detection
  - Stale record detection
  - Idempotent re-import behavior
  - Sticky manual status overrides
  - Import summaries
  - Status history entries
- Synthetic demo baseline CSV.
- Synthetic demo follow-up CSV.
- Kanban-style board grouped by current status.
- Property overview panel.
- Search, property, priority, and closed-status filters.
- Record detail panel with manual status, note, linked record, and history.
- Local static server.
- Node test suite.

### Good

- The first test suite passed: 5 passing tests.
- The app runs locally at `http://localhost:4173`.
- The app starts with synthetic demo data, which is safe for portfolio use.
- Importing a real CSV switches the app into private local data mode.
- The visual direction is operational and solid-color based, with no purple-heavy palette.

### Bad / Risks

- PowerShell blocks the `npm.ps1` shim on this machine, so this first slice avoids npm dependencies.
- This first UI is dependency-free JavaScript, not React yet.
- Browser-level visual QA has not been performed yet.
- Local persistence currently uses browser `localStorage`, which is fine for POC but not the long-term private data layer.

### I Did Not Know This Yet

- Whether local browser persistence will be enough for Carlos's daily private use.
- Whether the future public demo should allow visitors to upload arbitrary CSVs or only synthetic CSVs.
- Whether Auth/SuperAdmin should be implemented with Supabase, a static password gate, or a separate private build first.

### Outcome

First working local POC slice created and validated with automated tests plus basic local page checks.

### Validation

- `node --check src/main.js` passed.
- `node --check src/domain.js` passed.
- `node --test tests/*.test.mjs` passed with 5 tests.
- Local app shell returned HTTP 200.
- Main browser module returned HTTP 200.

## 2026-07-15 - Phase 5: Safer Imports and Local Backups

### Goal

Make imports safer and make private local data easier to preserve.

### Built

- Import preview panel before committing a CSV or demo follow-up import.
- Commit/cancel controls for pending imports.
- Preview metrics:
  - Rows
  - New records
  - Changed records
  - Stale records
  - Manual conflicts
  - Total records after import
- Local JSON backup export.
- Local JSON backup restore.
- Confirmation before resetting local data.
- Smoother note editing that saves without re-rendering the detail panel on every keystroke.
- Visual styling for the import preview panel.

### Good

- The import flow is less risky now because parsed data is previewed before it is committed.
- Backup/restore gives Carlos a way to preserve private local browser data.
- The real copied CSV successfully parsed through the JavaScript parser.
- Automated tests still pass.
- The app shell, JavaScript module, and stylesheet all return HTTP 200 locally.

### Bad / Risks

- Backup restore validation was shallow at this point; deeper validation was added later on 2026-07-20.
- Import preview currently shows aggregate counts only, not row-level examples of what changed.
- Browser-level visual QA still has not been completed with screenshots or interaction automation.
- Git has not been initialized yet.

### I Did Not Know This Yet

- Whether Carlos wants backup files to include demo/private mode metadata in a more formal manifest.
- Whether import preview should list changed records before commit.
- Whether reset should support separate "reset demo" and "clear private data" actions.

### Outcome

Phase 5 completed with safer import handling, backup/restore controls, passing tests, and successful parser validation against the real copied CSV.

## 2026-07-15 - Phase 5b: Import Preview Details

### Goal

Make the import preview more auditable by showing which records are affected, not only aggregate counts.

### Built

- Reconciliation output now includes:
  - `newIds`
  - `changedIds`
  - `staleIds`
  - `discrepancyIds`
- Import preview now shows compact ID lists for new, changed, stale, and manual-conflict records.
- Tests now assert preview ID arrays for follow-up imports.

### Good

- Import review is more trustworthy because the user can see sample affected IDs before committing.
- The preview stays compact by showing the first few IDs and a remaining count.
- Tests still pass.
- Real CSV parsing still succeeds.

### Bad / Risks

- Preview details show IDs only; a richer preview should eventually include status transitions and property names.
- The UI does not yet allow drilling into a pending import before commit.

### I Did Not Know This Yet

- Whether Carlos would prefer import preview sorted by property, status, or severity.
- Manual conflicts were later handled as an explicit warning before commit for the local POC.

### Outcome

Import previews now include auditable affected-record lists while keeping the UI compact.

## 2026-07-15 - Phase 6: Auditability and Linked Resolution

### Goal

Make the tool more trustworthy for recurring operations by improving audit visibility and implementing linked-record resolution behavior from the product spec.

### Built

- Effective status logic:
  - A record keeps its actual current status.
  - If it links to a closed record, the UI can treat it as effectively closed.
  - This supports original/follow-up ticket workflows.
- Linked-resolution helpers:
  - `effectiveStatus`
  - `isEffectivelyClosed`
  - `isLinkedResolved`
- Linked record edits now create manual history entries.
- Kanban grouping now uses effective status.
- Hide-closed filtering now uses effective status.
- Open counts and property open counts now use effective status.
- Cards show a `Linked resolved` badge.
- Record detail now shows:
  - Import status
  - Effective status
  - Linked record summary
- Import preview rows now include ID, property, and destination/effective status.
- Added a compact import history ledger showing recent import batches.
- Removed non-ASCII separators from source UI strings.

### Good

- A linked follow-up ticket can now resolve an otherwise open original record in the board and property counts.
- Linked record edits are auditable in history.
- The import history ledger makes repeated imports easier to trust.
- Automated tests increased from 5 to 6 and all pass.
- Real copied CSV parsing still succeeds.

### Bad / Risks

- Linked resolution is currently one-directional: the original record must link to the follow-up record.
- The import history ledger was summary-only at this point; a detail drawer was added later on 2026-07-20.
- Browser screenshot/interaction QA was not completed because browser-control tooling was not available in this session.
- There is still no Git repository initialized for version control.

### I Did Not Know This Yet

- Whether linked resolution should treat all closed statuses as resolved or only `Completed`.
- Whether linking should become bidirectional automatically.
- Whether linked records should have a dedicated relationship table in the future backend.

### Outcome

Phase 6 completed with effective linked-record resolution, stronger audit history, recent import visibility, passing tests, and local endpoint validation.

## 2026-07-15 - Phase 7A Start: QA and GitHub Handoff Prep

### Goal

Reduce the next blockers by documenting browser QA, preparing the project for GitHub upload, and initializing local Git without exposing private CSV data.

### Built

- GitHub-ready `README.md`.
- Current phase tracker: `PHASE_STATUS.md`.
- Browser/manual QA checklist: `QA_CHECKLIST.md`.
- GitHub upload guide: `GITHUB_HANDOFF.md`.
- Consolidated validation helper: `scripts/validate.mjs`.
- Expanded `.gitignore` for backup JSON and env files.
- Updated roadmap current progress section.
- Initialized local Git repository.

### Good

- The private real CSV is confirmed ignored by Git.
- Validation passes through a single helper command.
- The repo now has enough documentation to be understandable on GitHub.
- Browser QA has a concrete checklist instead of being a vague blocker.

### Bad / Risks

- Automated browser interaction QA is still not completed.
- Playwright/browser probing through the Node REPL failed due a local permission issue before package resolution.
- Git commands from Codex need a per-command safe-directory override because of Windows folder ownership.

### I Did Not Know This Yet

- Whether the GitHub repo will be public immediately or stay private until browser QA is complete.
- Whether Carlos will use HTTPS or SSH remote for GitHub.
- Whether the public repository should include the original product spec or keep that private.

### Outcome

Phase 7A documentation and local Git preparation are underway. Private data remains ignored and validation passes.

### Git Staging Blocker

Codex initialized the local Git repository and confirmed the private CSV is ignored. Staging was blocked because Git could not create `.git/index.lock` due Windows filesystem permissions on the `.git` folder.

Resolution path:

- Run the Git setup commands from Carlos's normal Windows terminal.
- If Git complains about ownership, delete `.git` and re-run `git init` as Carlos's normal Windows user.
- Follow `GITHUB_HANDOFF.md`.

### Validation

- `node scripts/validate.mjs` passed.

## 2026-07-20 - Phase 7B Portfolio View

### Goal

Make portfolio-safe screenshots a first-class public demo state without hosting or pretending production auth exists.

### Built

- Added a Public Demo-only `Portfolio View` toggle.
- Portfolio View hides workflow chrome: toolbar, board/detail grid, import preview panel, walkthrough, and import ledger.
- Portfolio View keeps the public proof surfaces visible: Snapshot, Operational Brief, Aging Risk, and Demo Proof Pack.
- `Full Demo` restores the interactive workflow.
- Owner mode does not show the Portfolio View toggle.

### Good

- Screenshot capture now starts from a clean synthetic public surface.
- Follow-up import preview state still flows into the visible brief and proof pack before commit.
- Public/Owner boundary remains intact.
- Mobile browser QA shows no page-level horizontal overflow.

### Bad / Risks

- This prepares screenshot capture but does not generate image files automatically.

### Outcome

Phase 7B now has a clean public-facing portfolio view for synthetic screenshots and quick reviewer scans.

### Validation

- `node scripts/validate.mjs` passed.
- Browser QA confirmed toggle behavior, preview state, Owner hiding, and mobile layout.

## 2026-07-20 - Phase 7B Portfolio Copy Pack

### Goal

Finish the copy side of portfolio-safe packaging with reusable public snippets generated from synthetic demo state.

### Built

- Added a Public Demo-only Portfolio Copy pack.
- Added Short Summary, Proof Bullets, and Privacy Caption snippets.
- Copy buttons use the browser clipboard API with a textarea fallback.
- Proof Bullets read pending synthetic follow-up preview state before commit.
- Copy state clears when generated text changes.
- Owner mode does not show the Portfolio Copy pack.

### Good

- Portfolio copy now lives beside the public proof surfaces instead of only in docs.
- Follow-up preview updates the proof bullets to the same operational signal shown in the brief and proof pack.
- The privacy caption reinforces synthetic-only public data and deferred hosted auth.
- Mobile browser QA shows no page-level horizontal overflow.

### Bad / Risks

- Browser automation could verify the copied UI state and generated text, but direct clipboard reads are limited by the automation environment.

### Outcome

Phase 7B now has screenshot surfaces and reusable synthetic-safe copy ready for the eventual portfolio websuite integration.

### Validation

- `node scripts/validate.mjs` passed.
- Browser QA confirmed copy pack visibility, copied state, preview updates, Owner hiding, and mobile layout.

## 2026-07-20 - Phase 7B Capture Presets

### Goal

Make portfolio screenshot capture practical by letting Public Demo stage clean proof states directly inside Portfolio View.

### Built

- Added Public Demo Capture Presets.
- Presets cover Baseline, Follow-Up Signal, Sticky Manual, and Linked Resolution.
- Capture Presets appear only in Portfolio View.
- Follow-Up Signal creates a synthetic pending import state while keeping the import preview panel hidden.
- Sticky Manual and Linked Resolution reuse the existing public proof states.
- Owner mode does not show Capture Presets.

### Good

- Portfolio View can now stage multiple screenshot states without returning to the full workflow.
- Public proof surfaces and Portfolio Copy update with each preset.
- The clean screenshot surface still hides board/detail workflow chrome.
- Mobile browser QA shows no page-level horizontal overflow.

### Bad / Risks

- This stages screenshot states but still does not export image files automatically.

### Outcome

Phase 7B now has a complete public-safe screenshot staging flow for the eventual portfolio websuite work.

### Validation

- `node scripts/validate.mjs` passed.
- Browser QA confirmed all presets, Owner hiding, and mobile layout.

## 2026-07-20 - Phase 7B Portfolio Screenshot Assets

### Goal

Capture final portfolio-safe screenshot files from synthetic Public Demo state.

### Built

- Added `docs/portfolio`.
- Captured `meldsync-portfolio-hero.png`.
- Captured Portfolio View proof-state screenshots for Baseline, Follow-Up Signal, Sticky Manual, and Linked Resolution.
- Added `docs/portfolio/README.md` as the screenshot manifest.

### Good

- Screenshot assets are generated from Public Demo Portfolio View only.
- Capture checks confirmed the synthetic notice was visible.
- Capture checks confirmed owner controls were hidden.
- Capture checks confirmed no page-level horizontal overflow.
- The hero screenshot gives a cleaner viewport asset for portfolio/websuite use.

### Bad / Risks

- Full-page screenshots can appear compressed in preview tools; the viewport hero capture is the cleaner first-use asset.

### Outcome

Phase 7B now has public-safe screenshot files and copy snippets ready for the later portfolio websuite integration.

### Validation

- `node scripts/validate.mjs` passed.
- Browser capture checks confirmed Public Demo, Portfolio View, hidden owner controls, synthetic notice, and no overflow.

## 2026-07-20 - Phase 7B Production Gate

### Goal

Close the hosted-auth decision gate without starting hosting work.

### Built

- Added an Owner-only Production Gate panel.
- The gate states hosted auth is deferred.
- The gate states owner data remains local only.
- The gate states Public Demo is the safe portfolio surface.
- Added `DEPLOYMENT_READINESS.md`.

### Good

- The app now makes the static POC boundary visible in Owner mode.
- The portfolio websuite rule is explicit: link only to synthetic Public Demo until real backend auth and protected storage exist.
- Public Demo remains clean and does not show owner readiness internals.

### Bad / Risks

- This is a readiness gate, not an auth implementation.

### Outcome

Phase 7B now has the hosted-auth posture captured both in-product and in a deployment readiness note.

### Validation

- `node scripts/validate.mjs` passed.
- Browser QA confirmed Owner visibility, Public hiding, and responsive layout.

## 2026-07-20 - Owner Restore Preview

### Goal

Remove the remaining native restore confirmation and make backup restore follow the same explicit preview pattern as imports and reset.

### Built

- Added pending restore state.
- Selecting a backup JSON now opens an in-app Restore Preview.
- Restore Preview shows mode, record count, import count, history count, manual count, stale count, exported timestamp, latest import, and workspace effect.
- Added explicit `Restore Backup` and `Cancel` actions.
- Backup validation now requires records, history, and imports.

### Good

- Backup restore no longer replaces local state directly after file selection.
- Cancel preserves the current owner workspace.
- Committing restore replaces the workspace only after the preview is visible.
- Mobile browser QA shows no page-level horizontal overflow.

### Bad / Risks

- A true downloaded export-to-restore round trip is still a manual browser-file check.

### Outcome

Owner restore is now aligned with the POC's no-silent-destructive-operation rule.

### Validation

- `node scripts/validate.mjs` passed.
- Browser QA confirmed restore preview, cancel, commit, cleanup reset, and mobile layout with a synthetic backup file.

## 2026-07-20 - Manual Conflict Visibility

### Goal

Make import-vs-manual discrepancies obvious in the UI instead of requiring the owner to infer them from history.

### Built

- Added manual conflict detection in the UI.
- Added a `Conflict` card badge when a manual status disagrees with the latest imported status.
- Added a selected-record Verification Conflict panel.
- Strengthened the manual override regression test to assert discrepancy count, discrepancy ids, and audit history note.

### Good

- Sticky manual truth is now visible and explainable in the record detail panel.
- Closed cards can show both `Manual` and `Conflict` badges when closed records are visible.
- The detail panel explains that the manual status remains authoritative.
- Mobile browser QA shows no page-level horizontal overflow.

### Bad / Risks

- The conflict panel was per selected record at this point; a compact queue view was added later on 2026-07-20.

### Outcome

Manual override protection is now easier to understand during owner QA and public proof demos.

### Validation

- `node scripts/validate.mjs` passed.
- Browser QA confirmed Sticky Manual Proof detail conflict, card badge when closed cards are shown, and mobile layout.

## 2026-07-20 - Import Preview Drill-Down

### Goal

Close the import-preview gap where affected IDs were visible but could not be inspected before commit.

### Built

- Import previews now auto-select the first affected record.
- Affected IDs in new, changed, stale, and manual-conflict groups are clickable.
- The read-only preview inspector shows current committed status, pending import status, priority, last-seen timestamp, property/unit, and description.
- Manual conflicts are labeled ahead of regular changed records when an ID appears in both buckets.
- Tablet and mobile layouts collapse the inspector to avoid cramped columns.

### Good

- Synthetic follow-up preview selects `MS-1007 - New` automatically.
- Clicking `MS-1001` shows the committed status versus pending import status before commit.
- Clicking `MS-1004` shows the stale record context.
- Desktop and mobile browser QA showed no page-level horizontal overflow.
- Validation remains green with 9 tests passing.

### Bad / Risks

- The drill-down is still read-only; deeper row-by-row diffing can come later if the CSV review workflow needs it.

### Outcome

Owner import review is now more auditable before commit, directly strengthening the safer-import workflow from Phase 5 while keeping hosting/auth work deferred.

### Validation

- `node scripts/validate.mjs` passed.
- Browser QA confirmed desktop and `390x844` mobile preview drill-down behavior.

## 2026-07-20 - Import History Detail Drawer

### Goal

Close the committed-import audit gap where the history ledger only showed summary cards.

### Built

- Import history batches are now selectable.
- The selected batch opens a detail drawer with rows, new, changed, stale, manual conflicts, and history-entry counts.
- The drawer lists affected IDs by new, changed, stale, and manual-conflict groups.
- Affected IDs in the drawer select the matching work order card/detail panel.
- Historical status labels now prefer the status recorded by that import batch instead of only showing the current record status.

### Good

- Committed follow-up imports auto-select the latest batch in the ledger.
- Selecting `demo-baseline` shows baseline imported statuses even after a later follow-up has changed records.
- Selecting the follow-up batch shows `1 new`, `2 changed`, `1 stale`, and `3` history entries.
- Desktop and mobile browser QA showed no page-level horizontal overflow.
- Validation remains green with 9 tests passing.

### Bad / Risks

- The drawer still shows compact affected lists and a short history trail; a production backend may eventually need a full import-detail page with every row.

### Outcome

The post-commit import history is now inspectable, which strengthens the owner audit trail without starting hosting, auth, or backend work.

### Validation

- `node scripts/validate.mjs` passed.
- Browser QA confirmed desktop and `390x844` mobile import history detail behavior.

## 2026-07-20 - Manual Conflict Queue

### Goal

Close the manual/import conflict gap where conflicts were visible only on the selected record.

### Built

- Added a compact Verification Queue for committed manual/import conflicts.
- The queue appears in the full working view when manual status disagrees with latest import status.
- Queue items show ID, property/unit, import status, and manual status.
- Clicking a queue item selects the affected work order and opens the existing detail conflict panel.
- Portfolio View remains clean and does not show the operational queue.

### Good

- Public Demo baseline shows no queue.
- Sticky Manual Proof shows `MS-1001` in the Verification Queue.
- Owner workflow can produce the same queue through manual edit plus committed follow-up import.
- Desktop and mobile browser QA showed no page-level horizontal overflow.
- Validation remains green with 9 tests passing.

### Bad / Risks

- The queue is still local/static POC UI; production conflict assignment or resolution workflows would need backend identity and storage later.

### Outcome

Manual/import conflict review is now a first-class owner workflow and a clearer public proof point without starting hosted auth or backend work.

### Validation

- `node scripts/validate.mjs` passed.
- Browser QA confirmed public baseline, sticky manual queue, owner workflow queue, and `390x844` mobile layout.

## 2026-07-20 - Deep Backup Validation

### Goal

Reduce owner-data risk by validating backup internals before a restore preview can replace local state.

### Built

- Moved backup validation into the domain layer so it can be covered by tests.
- Backup validation now checks mode, data container, records object, history array, imports array, and optional `lastBatch`.
- Record validation checks matched IDs, required status/property/timestamp fields, status source, stale boolean, and labor-hours number.
- Import batch validation checks counts and affected-ID arrays.
- History validation checks required audit fields and allowed source types.

### Good

- Malformed backups fail before Restore Preview opens.
- Valid synthetic backup restore preview still works in the browser.
- Validation coverage increased from 9 tests to 12 tests.
- Browser console remained clean.

### Bad / Risks

- This is still local-file validation, not a production backup/restore policy with signed exports or server-side storage.

### Outcome

Owner backup restore is safer for local POC use, and malformed internal backup shapes are caught before they can replace the workspace.

### Validation

- `node scripts/validate.mjs` passed with 12 tests.
- Browser QA confirmed valid synthetic backup restore preview still opens.

## 2026-07-20 - Manual-Conflict Commit Warning

### Goal

Answer the import-preview policy question for the POC: manual/import conflicts should warn before commit, not block the owner.

### Built

- Added a manual-conflict warning band inside Import Preview when `discrepancyCount` is greater than zero.
- The warning explains that manual statuses remain authoritative and the imported disagreement is recorded.
- The commit button changes from `Commit Import` to `Commit With Manual Conflicts` only when conflicts exist.
- The warning collapses cleanly on tablet/mobile.

### Good

- Normal follow-up import previews stay uncluttered.
- Manual-conflict imports now require a visibly different commit action.
- The behavior matches the POC's owner-controlled local workflow without pretending to enforce production approvals.
- Browser console remained clean.

### Bad / Risks

- This is a warning-only policy; production approval workflows would need identity, roles, and durable audit assignment later.

### Outcome

Manual/import conflicts are now clearly called out before commit while preserving the owner’s ability to keep moving in the local POC.

### Validation

- `node scripts/validate.mjs` passed with 12 tests.
- Browser QA confirmed normal preview, manual-conflict preview, and `390x844` mobile layout.
- Local preview returned HTTP 200.
- Git status confirms the private CSV is ignored.

### GitHub Remote Attempt

The GitHub repo now exists at:

```text
https://github.com/hypnoticdata777/m3ldSync.git
```

Codex attempted to add it as `origin`, but Windows permissions blocked writing `.git/config`. The handoff doc now contains the exact commands to run from Carlos's normal Windows terminal.

Final check:

- Validation still passes.
- Private CSV remains ignored.
- No remote is configured locally yet because `.git/config` could not be written by Codex.

## 2026-07-15 - Phase 7A GitHub Push Complete

### Goal

Confirm the GitHub upload succeeded after Carlos ran the Git commands from the normal Windows terminal.

### Verified

- `main` tracks `origin/main`.
- `origin` points to `https://github.com/hypnoticdata777/m3ldSync.git`.
- Latest commit is `03408e1 Initial m3ldSync POC`.

### Good

- The first MeldSync POC is now on GitHub.
- Local tracking is configured.
- The earlier Codex-only Git permission blocker is resolved by using Carlos's normal terminal.

### Bad / Risks

- Codex could not run `git ls-remote` because it does not have GitHub credentials in this environment.
- Browser interaction QA remains the next active blocker.

### Outcome

GitHub setup is complete. Phase 7A now moves fully to browser QA and UX hardening.

## 2026-07-15 - Phase 7A QA Hardening

### Goal

Reduce the browser QA blocker by adding automated demo-flow smoke checks and surfacing their status inside the app.

### Built

- `src/qa.js` demo QA scenario.
- `tests/qa.test.mjs`.
- In-app Demo QA panel.
- Validation now checks `src/qa.js` and runs QA tests.
- QA checklist now separates automated smoke checks from remaining manual browser checks.

### Good

- Core demo workflow now has repeatable smoke coverage.
- The dashboard can show whether the demo scenario is logically healthy.
- The QA checks cover baseline parsing, follow-up import counts, commit/cancel assumptions, sticky manual overrides, linked resolution, and backup-shaped state.

### Bad / Risks

- This is not a replacement for real browser interaction QA.
- Visual layout, click behavior, file picker behavior, download behavior, and responsive checks still require manual browser testing or a working browser automation tool.

### I Did Not Know This Yet

- Whether the public demo should expose the QA panel or keep it only for internal/private mode.
- Whether future browser automation should be added through Playwright after the npm/PowerShell environment is cleaned up.

### Outcome

Automated QA smoke checks are now part of the app and test suite. Manual browser QA remains the next part of Phase 7A.

### Validation

- `node scripts/validate.mjs` passed.
- Test count increased from 6 to 7.
- Local preview returned HTTP 200.

### Manual Screenshot Review

User-provided screenshots confirmed:

- The app loads locally at `localhost:4173`.
- Real CSV import preview renders with 502 rows.
- The committed private-data board renders with property list, Kanban columns, detail panel, and scrollable regions.
- Demo QA panel shows passing checks.

Privacy note:

- These screenshots contain real property/unit/work-order data and should not be used as public demo or portfolio screenshots.

### UX Follow-Up

- Header mode badge now distinguishes `Private Import Preview` from regular `Demo Data` while a real CSV import is pending.

### Validation

- `node scripts/validate.mjs` passed after the badge update.
- Local preview returned HTTP 200.

## 2026-07-15 - Phase 7A Demo Walkthrough

### Goal

Make the manual QA and public demo path easier to follow by adding a guided walkthrough tied to the automated QA checks.

### Built

- Demo walkthrough data in `src/qa.js`.
- `getDemoWalkthrough()` helper.
- Walkthrough coverage in `tests/qa.test.mjs`.
- In-app Demo Walkthrough panel.
- Responsive walkthrough card styling.
- README, QA checklist, phase status, and demo strategy updates.

### Good

- The dashboard now explains the intended demo flow without relying on external instructions.
- Each walkthrough step maps to an automated QA check.
- This helps both manual QA and eventual portfolio visitors.

### Bad / Risks

- The walkthrough is currently informational; it does not drive the UI or mark user-clicked steps complete.
- Manual browser QA is still needed to verify click behavior and responsive layout.

### I Did Not Know This Yet

- Whether the walkthrough should remain visible in the private real-data mode.
- Whether the public version should hide advanced private controls such as restore backup.

### Outcome

Phase 7A now has a guided demo walkthrough connected to automated smoke checks.

### Validation

- `node scripts/validate.mjs` passed.
- Test count increased from 7 to 8.
- Local preview returned HTTP 200.

## 2026-07-18 - Phase 7A Browser QA and UX Hardening

### Goal

Finish the hands-on browser QA pass for the demo reconciliation flow and harden any issues found before moving into public demo packaging.

### Built

- Added `setLinkedRecordDraft()` so linked-record text entered in the detail panel is saved as local draft state immediately.
- Wired `#linkInput` to save draft values on input, reducing the chance that a filled linked-record field disappears after refresh.
- Added regression coverage for linked-record draft persistence without noisy audit-history entries.
- Fixed desktop horizontal page overflow by allowing grid children and the Kanban board to shrink while keeping the board's internal horizontal scroll.

### Good

- Browser QA confirmed the synthetic demo loads cleanly at `http://localhost:4173`.
- Demo QA shows `7/7` and Demo Walkthrough shows `7/7`.
- Demo follow-up preview shows the expected import summary and cancel leaves baseline data unchanged.
- Commit adds the follow-up import ledger entry and updates record count/state.
- Manual status and note edits persist after reload.
- Linking an open record to a closed follow-up record changes effective status to `Completed`, lowers open count, and increments `Linked resolved`.
- Desktop page-level horizontal overflow is gone after the CSS fix.

### Bad / Risks

- Backup export and restore still need a manual browser download/file-picker pass.
- Reset confirmation still needs a manual browser confirmation pass.
- True tablet/mobile viewport QA still needs a resizable browser or dedicated Playwright setup.
- Linked-record draft persistence updates stored state before the detail summary rerenders; reload confirms persistence, but immediate summary refresh can be improved later.

### I Did Not Know This Yet

- The browser automation surface available in Codex does not expose a direct viewport resize helper in this session.
- The linked-record field could appear filled in automation without persisting if only the DOM value changed and no committed event reached app state.
- CSS grid children can force page-level horizontal overflow unless the board/grid children are explicitly allowed to shrink with `min-width: 0`.

### Outcome

Phase 7A browser QA is mostly complete for the public demo's core reconciliation story. Remaining items are file download/restore, reset confirmation, and true narrow/mobile viewport QA.

### Validation

- `node scripts/validate.mjs` passed.
- Test count increased from 8 to 9.
- Browser QA confirmed demo load, preview/cancel, commit, manual persistence, linked resolution, and desktop overflow fix.

## 2026-07-18 - Phase 7B Public Demo / Owner Workspace Boundary

### Goal

Create the first public-demo packaging slice so portfolio visitors see synthetic demo data only, while Carlos can still use local owner tools for private CSV work.

### Built

- Added session-based access mode persistence with `Public Demo` as the default.
- Added a header access switch for `Public Demo` and `Owner`.
- Public Demo starts from a fresh synthetic demo model and does not persist visitor interactions to private local storage.
- Owner mode loads/saves the local workspace and exposes CSV import, export backup, restore backup, reset, and internal QA controls.
- Public Demo hides the internal QA panel.
- Public Demo filters the walkthrough to visitor-safe actions only, showing `6/6`; Owner keeps the full `7/7` walkthrough including backup.
- README, demo strategy, phase status, and QA checklist now describe the access-mode boundary and its POC limitation.

### Good

- Public visitors get a cleaner first impression with only demo-safe controls.
- Private tools are still available locally without adding backend complexity yet.
- The app no longer asks public visitors to follow a walkthrough step for a hidden owner-only backup action.
- Browser QA confirmed the mode split works from the actual UI.

### Bad / Risks

- This is not secure authentication; it is a static-app workspace boundary.
- Owner mode is discoverable because all code is client-side.
- Real hosted multi-user use still needs backend auth and server-side authorization.

### I Did Not Know This Yet

- The first public-mode pass still exposed the words `Export Backup` through the walkthrough even though the button was hidden.
- Filtering walkthrough steps by access mode gives a cleaner public demo without duplicating QA scenario data.

### Outcome

Phase 7B has its first working slice: a public synthetic demo surface plus a local owner workspace surface.

### Validation

- `node scripts/validate.mjs` passed.
- Browser QA confirmed Public Demo shows only demo buttons and a `6/6` walkthrough.
- Browser QA confirmed Owner mode shows private controls, internal QA, and the full `7/7` walkthrough.

## 2026-07-20 - Phase 7A Reset Confirmation Hardening

### Goal

Replace the native reset confirmation dialog with an in-app confirmation panel that is visible, testable, and clearer for owner workspace use.

### Built

- Added reset confirmation state in `src/main.js`.
- Replaced the `Reset Local Data` native `confirm()` path with an inline owner reset panel.
- Added `Confirm Reset` and `Keep Current Data` actions.
- Closed the reset panel when changing access mode, loading demo baseline, starting imports, committing imports, canceling imports, or starting restore.
- Added amber warning styling for the reset confirmation panel.

### Good

- Browser QA confirmed no native dialog appears when reset is clicked.
- `Keep Current Data` closes the panel and preserves the current 7-record follow-up state.
- `Confirm Reset` clears local owner data and reloads the 6-record synthetic demo baseline.
- Validation remains green with 9 tests passing.

### Bad / Risks

- Backup export download and restore file-picker QA are still separate remaining checks.
- Restore still uses a native confirmation dialog and can be revisited after backup QA if we want every destructive owner action inline.

### Outcome

Reset confirmation is no longer a Phase 7A browser blocker.

### Validation

- `node scripts/validate.mjs` passed.
- Browser QA confirmed reset cancel/confirm behavior in Owner mode.

## 2026-07-20 - Phase 7A Backup Restore and Responsive QA

### Goal

Continue the remaining Phase 7A browser QA after the inline reset confirmation commit.

### Built

- Hardened backup export by delaying `URL.revokeObjectURL()` until after the click stack, reducing the chance that browsers cancel a Blob download too early.

### Good

- Restore Backup opened the file picker through browser automation.
- A synthetic JSON backup restored successfully and replaced local state with the selected backup.
- Restore produced no console errors.
- Tablet checks passed at `820x900` in Public Demo and Owner mode.
- Mobile checks passed at `390x844` in Public Demo and Owner mode.
- Public Demo remained visitor-safe at narrow widths.
- Owner controls wrapped without text overflow.
- The page had no document-level horizontal overflow; the board retained its intended internal horizontal scroll.
- Validation remains green with 9 tests passing.

### Bad / Risks

- The in-app browser still did not observe the Blob download event after clicking `Export Backup`.
- Export produced no console errors and left app state intact, but the actual downloaded JSON still needs manual confirmation from Windows/Chrome.
- A true export-to-restore round trip remains pending until the downloaded file is manually confirmed.

### Outcome

Restore file-picker QA and responsive layout QA are complete for Phase 7A. Backup export download remains the only browser QA blocker.

### Validation

- `node scripts/validate.mjs` passed.
- Browser QA confirmed restore with synthetic backup.
- Browser QA confirmed tablet/mobile layout at `820x900` and `390x844`.

## 2026-07-20 - Phase 7B Public Demo Data-Boundary Polish

### Goal

Make the public demo safer and clearer for portfolio review by labeling the data boundary directly in the app.

### Built

- Added a compact Public Demo notice that states the workspace is synthetic and excludes real properties, units, descriptions, CSV uploads, backups, and owner storage.
- Added a compact Owner notice that states CSV imports and backup restores stay local to the browser unless exported.
- Styled the notices as quiet operational status strips that work on desktop and mobile.
- Updated README, demo strategy, phase status, and QA checklist.

### Good

- Public Demo still hides private owner controls.
- Owner mode still exposes import, export, restore, reset, and QA controls.
- Desktop and mobile browser QA confirmed the notices do not create page-level horizontal overflow.
- Browser console remained clean.
- Validation remains green with 9 tests passing.

### Bad / Risks

- Public screenshots still need to be captured from synthetic data only.
- Manual Windows confirmation of the backup export download remains open.

### Outcome

Phase 7B public demo polish now has a clearer in-app data-boundary signal for reviewers and screenshots.

### Validation

- `node scripts/validate.mjs` passed.
- Browser QA confirmed Public Demo and Owner notices at desktop width and `390x844`.

## 2026-07-20 - Phase 7A Browser QA Complete

### Goal

Close the final manual Phase 7A browser QA item by confirming backup export download behavior outside the in-app automation surface.

### Good

- Manual Windows browser check confirmed `Export Backup` downloads `meldsync-backup-2026-07-20*.json` files.
- The browser downloads panel showed multiple MeldSync backup JSON files from local owner mode.
- This confirms the export path that in-app browser automation could click but could not observe as a download event.

### Outcome

Phase 7A browser QA and UX hardening are complete for the local POC.

### Remaining Work

- Continue Phase 7B portfolio-safe public demo packaging using synthetic data only.

## 2026-07-20 - Phase 7B Public Demo Snapshot

### Goal

Give investors and portfolio reviewers a fast synthetic portfolio read before they inspect the board.

### Built

- Added a Public Demo Snapshot panel that appears only in Public Demo mode.
- Snapshot shows synthetic portfolio scope, open work, latest import summary, and private-surface status.
- Owner mode omits the Public Demo Snapshot so the private workspace stays operationally focused.
- Added responsive snapshot styling.
- Updated README, demo strategy, phase status, and QA checklist.

### Good

- Public Demo now has a stronger investor-facing first scan without becoming a landing page.
- Public Demo still hides private owner controls.
- Owner mode still exposes local private tools without the public-facing snapshot.
- Desktop and mobile browser QA confirmed no page-level horizontal overflow.
- Browser console remained clean.
- Validation remains green with 9 tests passing.

### Bad / Risks

- Portfolio-safe screenshots still need to be captured from synthetic data only.
- Hosted deployment/auth remains a future design step.

### Outcome

Phase 7B now has a clearer public-facing snapshot for reviewers and investor conversations.

### Validation

- `node scripts/validate.mjs` passed.
- Browser QA confirmed Public Demo Snapshot visibility in Public Demo only.
- Browser QA confirmed desktop and `390x844` mobile layout.

## 2026-07-20 - Phase 7B Operational Brief

### Goal

Make the public investor demo communicate reconciliation impact immediately while staying aligned to the POC's FR/NFR: synthetic data only, no hosting yet, and no private owner controls exposed.

### Built

- Added a Public Demo-only Operational Brief.
- The brief shows import signal, triage focus, verification queue, and human-correction counts.
- During a synthetic follow-up import preview, the brief reads from the pending import state so reviewers see proposed impact before committing.
- Owner mode does not show the Operational Brief.

### Good

- Public Demo now demonstrates RF-4 post-import summary and RF-12 stale-record handling faster.
- The brief updates from baseline to `1 new, 2 changed, 1 stale` during preview and remains consistent after commit.
- Public Demo still hides private controls.
- Browser console remained clean.
- Validation remains green with 9 tests passing.

### Bad / Risks

- This is still a local/static POC surface; hosting and portfolio websuite connection remain intentionally deferred.

### Outcome

The public investor demo now has a dynamic operational signal layer, not just static documentation or a generic dashboard view.

### Validation

- `node scripts/validate.mjs` passed.
- Browser QA confirmed baseline, preview, and committed brief states.

## 2026-07-20 - Phase 7B Public Proof Controls

### Goal

Make the public demo prove the POC's load-bearing FR/NFR claims without requiring a reviewer to manually build the state from the detail panel.

### Built

- Added Public Demo-only proof controls.
- Sticky Manual Proof creates a synthetic state where `MS-1001` remains completed after a follow-up import reports it as pending.
- Linked Resolution Proof creates a synthetic state where `MS-1001` is effectively completed through linked record `MS-1002`.
- Owner mode does not show the public proof controls.

### Good

- Sticky Manual Proof shows `Manual 1` and selected proof record `MS-1001 - Completed`.
- Linked Resolution Proof shows `Linked resolved 1` and selected proof record `MS-1001 - Completed`.
- Public Demo still hides private controls.
- Mobile layout has no page-level horizontal overflow.
- Browser console remained clean.
- Validation remains green with 9 tests passing.

### Bad / Risks

- These are synthetic proof states for public review, not production workflows or authentication.

### Outcome

The public POC now gives reviewers one-click proof of sticky manual truth and linked-record resolution, directly supporting RF-10, RF-11, NRF-2, and the investor demo story.

### Validation

- `node scripts/validate.mjs` passed.
- Browser QA confirmed sticky manual and linked-resolution proof controls.

## 2026-07-20 - Phase 7B Aging Risk Panel

### Goal

Add a real product surface for RF-6 property-level triage: which properties need attention first, and why.

### Built

- Added an Aging Risk panel.
- Risk ranking considers active open work, high-priority records, stale records, and oldest open age.
- The panel reads pending synthetic import state during demo preview, so proposed risk changes appear before commit.
- The panel remains available in Owner mode for operational use.

### Good

- Baseline demo ranks Harbor Flats first with `2 open`, `15d oldest`, and `1 high priority`.
- Synthetic follow-up preview moves Maple Court to the top with `2 open`, `1 high priority`, and `1 stale`.
- The committed state matches the previewed risk ranking.
- Browser QA showed no page-level overflow and no console errors.
- Validation remains green with 9 tests passing.

### Bad / Risks

- Risk scoring is intentionally simple for the POC and should be tuned with real operating preferences later.

### Outcome

The POC now shows property-level aging risk as a first-class triage surface, strengthening the public investor story and the private ops workflow.

### Validation

- `node scripts/validate.mjs` passed.
- Browser QA confirmed baseline, preview, committed, Owner mode, and mobile risk states.

## 2026-07-20 - Phase 7B Public Proof Pack

### Goal

Turn portfolio-safe packaging into a visible app surface instead of a docs-only task.

### Built

- Added a Public Demo-only Proof Pack panel.
- The panel summarizes reconciliation, verification, manual memory, linked resolution, top focus, and data-boundary evidence.
- The panel reads pending synthetic import state during demo preview, so screenshot evidence updates before commit.
- Owner mode does not show the public Proof Pack.

### Good

- Public Demo has a tighter reviewer scan for screenshots and investor walkthroughs.
- The panel reinforces existing FR/NFR proof without exposing owner controls or private data.
- The surface stays compact and operational instead of becoming a landing page.

### Bad / Risks

- The proof pack is still synthetic demo evidence, not production telemetry.

### Outcome

Phase 7B portfolio packaging now has a dedicated in-app proof surface that can be captured safely with synthetic data.

### Validation

- `node scripts/validate.mjs` passed.
