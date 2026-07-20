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

- Backup restore currently trusts the internal state shape after shallow validation; deeper validation should be added before daily reliance.
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
- Whether manual conflicts should block commit or simply warn before commit.

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
- The import history ledger is summary-only; it does not yet open a full import detail drawer.
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
