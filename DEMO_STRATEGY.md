# MeldSync Demo Strategy

## Demo Goal

The public demo should prove that MeldSync turns repeated maintenance CSV exports into operational memory.

The visitor should understand three things quickly:

1. The tool detects what changed between exports.
2. Manual corrections survive future imports.
3. Property-level triage is easier than spreadsheet review.

## Audience

Primary:

- Portfolio reviewers
- Hiring managers
- Technical collaborators
- Property operations leaders

Secondary:

- Property Meld or adjacent software teams
- Investors or advisors interested in operations tooling

## Recommended Public Demo Experience

Default mode:

- Start in Demo Data mode.
- Show a synthetic portfolio already loaded.
- Show a guided walkthrough of the demo flow.
- Provide a button to run a follow-up import.
- Show new, changed, and stale counts immediately after the follow-up import.
- Let visitors manually mark a record complete.
- Let visitors rerun the follow-up import and see that the manual correction survives.
- Hide private import, backup, restore, reset, and internal QA controls.

Owner mode:

- Allow uploading a CSV with the same schema.
- Treat uploaded data as local browser-only data.
- Display a clear Private Local Data indicator.
- Show backup, restore, reset, and internal QA controls.

Important POC note:

- The current Owner mode is a local static-app workspace boundary, not secure authentication.
- A hosted version needs real backend auth before storing private workspaces or multi-user data.

## SuperAdmin Experience

Carlos's private experience should eventually support:

- Real CSV imports
- Persistent private data
- Backup/restore
- Full history
- Manual corrections
- Linked records
- Possibly authentication

The public demo should not require Carlos to expose or manage real data.

## Portfolio Copy Angle

Suggested positioning:

> MeldSync reconciles recurring maintenance exports against prior snapshots, preserving manual verification and surfacing operational drift across a property portfolio.

## Demo Proof Points

The most important proof points to show:

- Re-import idempotency
- Sticky manual override
- Stale record detection
- Status change history
- Property-level open work summary
- Safe synthetic demo data

## Demo Risks

- A generic dashboard UI would undersell the operational insight.
- Too much fake data would make the app feel noisy instead of sharp.
- Real data in screenshots or fixtures would create privacy risk.
- Login-first design would hide the core workflow from portfolio visitors.
- A fake login could overstate the security model; until backend auth exists, owner mode should be described as a local POC boundary.
