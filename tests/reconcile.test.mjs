import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmptyState,
  effectiveStatus,
  isEffectivelyClosed,
  isLinkedResolved,
  parsePropertyMeldCsv,
  reconcile,
  setLinkedRecord,
  setLinkedRecordDraft,
  setManualStatus
} from "../src/domain.js";
import { demoBaselineCsv, demoFollowUpCsv } from "../src/demoData.js";

test("parses the Property Meld CSV contract", () => {
  const rows = parsePropertyMeldCsv(demoBaselineCsv);

  assert.equal(rows.length, 6);
  assert.equal(rows[0].id, "MS-1001");
  assert.equal(rows[0].sourceStatus, "Pending vendor acceptance");
  assert.equal(rows[4].unit, "");
  assert.equal(rows[0].completedDate, null);
});

test("re-importing the same snapshot is idempotent", () => {
  const rows = parsePropertyMeldCsv(demoBaselineCsv);
  const first = reconcile(createEmptyState(), rows, {
    uploadedAt: "2026-07-10T12:00:00.000Z",
    batchId: "batch-1"
  });
  const second = reconcile(first.state, rows, {
    uploadedAt: "2026-07-10T13:00:00.000Z",
    batchId: "batch-2"
  });

  assert.equal(first.batch.newCount, 6);
  assert.equal(second.batch.newCount, 0);
  assert.equal(second.batch.statusChangedCount, 0);
  assert.equal(second.batch.staleCount, 0);
  assert.equal(second.state.history.length, first.state.history.length);
});

test("follow-up import detects new, changed, and stale records", () => {
  const firstRows = parsePropertyMeldCsv(demoBaselineCsv);
  const nextRows = parsePropertyMeldCsv(demoFollowUpCsv);
  const first = reconcile(createEmptyState(), firstRows, {
    uploadedAt: "2026-07-10T12:00:00.000Z",
    batchId: "batch-1"
  });
  const second = reconcile(first.state, nextRows, {
    uploadedAt: "2026-07-11T12:00:00.000Z",
    batchId: "batch-2"
  });

  assert.equal(second.batch.newCount, 1);
  assert.equal(second.batch.statusChangedCount, 2);
  assert.equal(second.batch.staleCount, 1);
  assert.deepEqual(second.batch.newIds, ["MS-1007"]);
  assert.deepEqual(second.batch.changedIds, ["MS-1001", "MS-1002"]);
  assert.deepEqual(second.batch.staleIds, ["MS-1004"]);
  assert.equal(second.state.records["MS-1004"].stale, true);
});

test("manual status overrides survive future imports", () => {
  const firstRows = parsePropertyMeldCsv(demoBaselineCsv);
  const nextRows = parsePropertyMeldCsv(demoFollowUpCsv);
  const first = reconcile(createEmptyState(), firstRows, {
    uploadedAt: "2026-07-10T12:00:00.000Z",
    batchId: "batch-1"
  });
  const manuallyCorrected = setManualStatus(first.state, "MS-1002", "Completed", "2026-07-10T13:00:00.000Z");
  const second = reconcile(manuallyCorrected, nextRows, {
    uploadedAt: "2026-07-11T12:00:00.000Z",
    batchId: "batch-2"
  });

  assert.equal(second.state.records["MS-1002"].currentStatus, "Completed");
  assert.equal(second.state.records["MS-1002"].statusSource, "manual");
});

test("linked records can resolve an otherwise open original record", () => {
  const firstRows = parsePropertyMeldCsv(demoBaselineCsv);
  const nextRows = parsePropertyMeldCsv(demoFollowUpCsv);
  const first = reconcile(createEmptyState(), firstRows, {
    uploadedAt: "2026-07-10T12:00:00.000Z",
    batchId: "batch-1"
  });
  const second = reconcile(first.state, nextRows, {
    uploadedAt: "2026-07-11T12:00:00.000Z",
    batchId: "batch-2"
  });
  const linked = setLinkedRecord(second.state, "MS-1001", "MS-1002");
  const record = linked.records["MS-1001"];

  assert.equal(record.currentStatus, "Pending completion");
  assert.equal(effectiveStatus(record, linked.records), "Completed");
  assert.equal(isEffectivelyClosed(record, linked.records), true);
  assert.equal(isLinkedResolved(record, linked.records), true);
  assert.equal(linked.history.at(-1).note, "Linked record updated");
});

test("linked record drafts persist without writing audit history on every keystroke", () => {
  const rows = parsePropertyMeldCsv(demoBaselineCsv);
  const first = reconcile(createEmptyState(), rows, {
    uploadedAt: "2026-07-10T12:00:00.000Z",
    batchId: "batch-1"
  });
  const previousHistoryCount = first.state.history.length;
  const drafted = setLinkedRecordDraft(first.state, "MS-1001", " MS-1002 ");

  assert.equal(drafted.records["MS-1001"].linkedRecordId, "MS-1002");
  assert.equal(drafted.history.length, previousHistoryCount);
});

test("missing required columns fail clearly", () => {
  const badCsv = `Meld Number,Unit\nMS-1,101`;
  assert.throws(() => parsePropertyMeldCsv(badCsv), /missing required column/);
});
