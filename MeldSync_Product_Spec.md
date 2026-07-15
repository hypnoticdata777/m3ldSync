# MeldSync

### Recurring Work Order Reconciliation & Kanban Tool

**Product Specification — Proof of Concept**

|  |  |
| :---- | :---- |
| **Author** | Carlos Sanchez Gonzalez |
| **Context** | Built to support portfolio-wide maintenance operations across \~120 residential units as Operations Manager at Paragon Property Management |
| **Document status** | Draft — Proof of Concept Specification |
| **Version** | 1.0 |
| **Stack (proposed)** | React / React Native \+ FastAPI \+ Supabase if we cant find another one they are too unstable, or a lightweight browser-based prototype with client-side persistence |

---

## 1\. Executive Summary

Property maintenance systems (Property Meld and comparable platforms) export point-in-time snapshots of work orders, but give no native way to track *change over time*, distinguish a system-reported status from a manually verified one, or retain notes and corrections across repeated exports. Operations teams are left reconciling CSV exports by hand on a recurring cadence, a process that's slow and, more importantly, silently discards institutional knowledge every time a new export overwrites the last one.

MeldSync is a small, single-user tool that ingests a recurring CSV export, reconciles it against everything previously known, and surfaces the result as a Kanban board organized by status and cross-referenced by property. Its core design principle: **manual corrections are permanent.** Once a person has verified or corrected a record, no future automated import is allowed to silently override that judgment.

## 2\. Problem Statement

A recurring maintenance export needs three things a plain spreadsheet doesn't give you:

1. **Change detection** — what's new since the last snapshot, what changed status, and what's gone quiet (no longer present in the latest export, but not necessarily resolved).  
2. **A durable correction layer** — the source system's status label is not always accurate (see Section 6.4 for a concrete example), so the tool needs a place for verified, human-confirmed status that survives future imports.  
3. **A property-level view** — for operational triage, the useful question isn't "list every work order," it's "what's still open at *this* property, and how long has it been sitting."

## 3\. Goals & Non-Goals

**In scope (v1):**

- Recurring CSV import with de-duplication against prior imports  
- Automatic diffing: new / status-changed / stale records  
- Kanban view, batched by status, cross-referenced by property  
- Manual status override and free-text notes per record, protected from being overwritten by future imports  
- Ability to link related records (e.g., an original ticket and its follow-up/clone)  
- Full change history per record (what changed, when, and whether the change came from an import or a manual edit)

**Out of scope (v1):**

- Direct API integration with the source system (v1 is file-based, not a live sync)  
- Multi-user accounts or permissions  
- Notifications/alerts  
- Native mobile app (a responsive web view is sufficient)

## 4\. Users

Single-user tool for an operations manager overseeing recurring maintenance work orders across a multi-property portfolio. No multi-tenant auth required for v1.

## 5\. Development Approach

A one-person tool doesn't need a heavyweight process, but it does need the riskiest logic proven before anything is built on top of it. Recommended sequence:

1. **Data modeling** (Section 6.3) — define the entity model and reconciliation rules before writing any UI code, since the correctness of the whole tool depends on these semantics.  
2. **Spike: the reconciliation engine, in isolation** — build and unit-test the diffing logic against real export fixtures before touching a UI. This is the highest-risk component (duplicate imports, status-transition edge cases, matching logic) and the easiest to get subtly wrong.  
3. **MVP** — connect the reconciliation engine to a persistence layer and a Kanban UI.  
4. **Manual override layer** — status/notes editing that survives future imports.  
5. **History view** — a per-record audit trail.  
6. **Hardening pass** — deliberately test the edge cases in Section 9 before relying on the tool day-to-day.  
7. **Iteration** — trend analysis, aging reports, and similar v2 features come after the core loop (import → reconcile → correct → persist) is proven stable.

## 6\. System Design

### 6.1 Implementation Paths

Two viable ways to build this, worth deciding explicitly since the architecture differs:

|  | Path A — Rapid Prototype | Path B — Production Build |
| :---- | :---- | :---- |
| **Environment** | Browser-based artifact with client-side persistence | Full application — React/React Native \+ FastAPI \+ Supabase |
| **Persistence** | Key-value store, single-user scope, JSON-serializable data, small per-record size limits | Relational database, unconstrained schema |
| **Import handling** | Client-side file parsing (no server round-trip) | Client or server-side parsing, extensible to a live API integration later |
| **Time to first working version** | Low — no deployment or infrastructure | Higher — but reuses an existing production stack |
| **Best fit** | Fast validation of the reconciliation logic and UI, minimal ceremony | A tool intended to be maintained, extended, and eventually integrated with adjacent systems |

Recommendation: prototype the reconciliation engine and data model in Path A to validate the approach quickly, then port to Path B for a durable, extensible version. The reconciliation logic (Section 6.2) is intentionally decoupled from its storage layer, so this migration doesn't require rewriting the core logic.

### 6.2 The Reconciliation Engine

The record's stable identity key (its ticket/meld number) drives every reconciliation. On each import:

1. Parse the new export into rows.  
2. For each row, look up its identity key against existing stored records.  
3. **Not found in storage** → new record. Insert it, mark `firstSeenAt: <import date>`.  
4. **Found, status unchanged** → update `lastSeenAt` only.  
5. **Found, status changed** → update status, append a `StatusHistoryEntry` with `source: import`.  
6. **Previously stored, but absent from the new export** → do **not** delete or assume resolved. Flag `stale: true`. Absence from a rolling-window export usually means the record fell outside the export's date range, not that the underlying issue is closed — the UI must visually distinguish "confirmed current per latest import" from "not recently seen, needs manual verification."  
7. **A manual override exists on this record** → the import must never silently overwrite it. If the import reports a different status than the manual override, log the discrepancy as a `StatusHistoryEntry` for visibility, but the manual value remains authoritative.

Rule 7 is the load-bearing design decision in this system (see Section 6.4).

### 6.3 Data Model

Record

  id                    // stable identity key from the source export

  property

  unit

  category

  workType

  description

  priority              // e.g., Emergency | High | Medium | Low

  currentStatus         // authoritative status: manual override wins over import

  statusSource          // "import" | "manual"

  createdDate

  completedDate          // nullable

  firstSeenAt            // first import in which this record appeared

  lastSeenAt              // most recent import that included this record

  stale                   // true if absent from the most recent import

  note                    // free-text, manual, persists across imports

  linkedRecordId           // nullable — marks a duplicate/follow-up relationship

StatusHistoryEntry

  recordId

  timestamp

  fromStatus

  toStatus

  source                 // "import" | "manual"

  importBatchId           // nullable, references the triggering import if source \= import

ImportBatch

  id

  uploadedAt

  filename

  rowCount

  newCount

  statusChangedCount

  staleCount              // records not present in this import but present in a prior one

### 6.4 Design Rationale: Why Manual Overrides Must Be Sticky

During initial manual reconciliation of a 90-day export against a static tracker, several records were flagged as long-stalled based on the source system's own status label. Manual verification against the individual record pages revealed that in more than one case, the underlying issue had actually been resolved — a follow-up or cloned ticket showed a completed status, or the record's own activity log showed resolution, while the top-level status field itself remained a stale, misleading label.

This is a common failure mode in systems where status fields are set once and rarely revisited: the label drifts out of sync with reality. A reconciliation tool that treats the source system's status as ground truth on every import will keep re-surfacing already-resolved issues indefinitely. A tool that lets a human correct the record — and then protects that correction from being overwritten by the next import — closes that gap permanently rather than requiring the same manual verification on every cycle.

This is the reasoning behind Rule 7 in Section 6.2 and RF-11/NRF-2 below.

## 7\. Functional Requirements

| ID | Requirement |
| :---- | :---- |
| RF-1 | Import a CSV in the source system's standard export format. |
| RF-2 | Run the reconciliation engine (Section 6.2) against existing stored data on every import. |
| RF-3 | Prevent duplicate ingestion — re-importing an identical export produces zero new records and zero spurious history entries. |
| RF-4 | Display a post-import summary: new records, status changes, and newly stale records. |
| RF-5 | Kanban view: columns by status, cards showing property, unit, category, description, priority, and days-open. |
| RF-6 | Property overview panel: per-property open/completed/canceled counts and oldest-open age, filterable by clicking a property. |
| RF-7 | Search and filter by property, unit, identifier, description, and priority. |
| RF-8 | Manually change a record's status directly in the UI. |
| RF-9 | Add or edit a free-text note on any record, independent of status. |
| RF-10 | Link two records as duplicates/follow-ups, so the UI treats the pair as resolved once either side is confirmed complete. |
| RF-11 | Manual overrides (status, note, link) persist through future imports and are never silently overwritten (Section 6.2, Rule 7). |
| RF-12 | Records absent from the latest import are flagged stale/needs-verification rather than removed. |
| RF-13 | A history view per record shows every status transition, its timestamp, and its source (import or manual). |
| RF-14 | Toggle visibility of closed-status columns (e.g., Completed, Canceled) to reduce visual noise. |

## 8\. Non-Functional Requirements

| ID | Requirement |
| :---- | :---- |
| NRF-1 | **Idempotency.** Re-importing an identical export is a safe no-op (RF-3). This is the single most important correctness property in the system and should be covered by an explicit test before the tool is trusted for daily use. |
| NRF-2 | **Sticky manual state.** No import path may overwrite a manually-set status or note (RF-11). Test: import a snapshot, manually mark a record resolved, re-import a snapshot showing the same record as still open, and assert the manual status survives unchanged. |
| NRF-3 | **Data privacy.** The dataset includes tenant and property identifiers. Persistence should be scoped to the individual user; the tool should not be deployed publicly without authentication. |
| NRF-4 | **Performance.** Should comfortably handle 1,000–2,000 records (multiple years of exports) without noticeable UI lag. Client-side filtering is sufficient at this scale. |
| NRF-5 | **Resilience to schema drift.** If the source export's column structure changes, import should fail with a clear, visible error rather than silently misassigning fields. |
| NRF-6 | **No silent destructive operations.** Any bulk action (e.g., "mark all stale records verified") must show a preview and require confirmation before committing — bulk operations are where silent data corruption is most likely to occur. |
| NRF-7 | **Specification portability.** The data model (Section 6.3) and reconciliation rules (Section 6.2) are the binding contract, independent of implementation language or framework, to support building this on a different stack or handing it to another engineer/agent to implement. |
| NRF-8 | **Testability.** The reconciliation engine must be unit-testable independent of the UI — given two snapshots, it should return a deterministic diff with no browser or database dependency required. |

## 9\. Build Plan

1. Reconciliation engine as a pure function: `reconcile(previousState, newImportRows) → { new, changed, stale, unchanged }`. Cover with fixture-based tests before anything else.  
2. Persistence layer: wire the engine's output to storage.  
3. Kanban UI: status-based columns, property cross-reference panel, search/filter.  
4. Manual override UI: inline status control and note field per record, writing with `statusSource: manual`.  
5. History view: per-record `StatusHistoryEntry` timeline.  
6. Link/merge UI (RF-10) — addresses the exact failure mode described in Section 6.4.

## 10\. Open Questions & Future Work

- **Trend analysis:** Should the tool eventually report aggregate metrics (e.g., average days-to-close by category over a rolling window)? This affects whether historical records should be retained indefinitely or pruned after a retention period.  
- **Stale record handling:** Should records absent from imports for an extended period ever auto-resolve, or should they always require manual sign-off? Given the failure mode in Section 6.4, defaulting to manual sign-off is the safer choice, at the cost of some manual review overhead.  
- **Live integration:** If a future version integrates directly with the source system's API rather than relying on file exports, the reconciliation engine's input contract ("a list of records") should remain unchanged — only the ingestion layer changes. Designing for this now avoids a rewrite later.

---

*This specification defines requirements and design rationale only. No implementation has been built against this document as of the time of writing.*  
