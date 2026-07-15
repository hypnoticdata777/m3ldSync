import {
  createEmptyState,
  effectiveStatus,
  isLinkedResolved,
  parsePropertyMeldCsv,
  reconcile,
  setLinkedRecord,
  setManualStatus
} from "./domain.js";
import { demoBaselineCsv, demoFollowUpCsv } from "./demoData.js";

export const DEMO_WALKTHROUGH_STEPS = [
  {
    id: "baseline",
    title: "Start with demo data",
    action: "Load Demo Baseline",
    expected: "Six synthetic work orders appear with open, completed, and property-level context.",
    qaCheck: "Demo baseline"
  },
  {
    id: "preview",
    title: "Preview a follow-up import",
    action: "Run Demo Follow-Up Import",
    expected: "The import preview shows one new record, two changed records, and one stale record.",
    qaCheck: "Follow-up preview"
  },
  {
    id: "cancel",
    title: "Cancel safely",
    action: "Cancel",
    expected: "The board remains on the baseline dataset because the preview was not committed.",
    qaCheck: "Cancel-safe state"
  },
  {
    id: "commit",
    title: "Commit the follow-up",
    action: "Run follow-up again, then Commit Import",
    expected: "The board updates to seven records and the import ledger records the batch.",
    qaCheck: "Commit state"
  },
  {
    id: "manual",
    title: "Protect a manual correction",
    action: "Change a record status manually",
    expected: "The manual status remains authoritative when a later import disagrees.",
    qaCheck: "Sticky manual override"
  },
  {
    id: "linked",
    title: "Resolve through a follow-up",
    action: "Link MS-1001 to MS-1002",
    expected: "The original pending ticket is treated as effectively resolved by the completed follow-up.",
    qaCheck: "Linked resolution"
  },
  {
    id: "backup",
    title: "Preserve local work",
    action: "Export Backup",
    expected: "Records, history, and import batches are saved as a local JSON backup.",
    qaCheck: "Backup shape"
  }
];

export function runDemoQa() {
  const checks = [];

  const baselineRows = parsePropertyMeldCsv(demoBaselineCsv);
  const followUpRows = parsePropertyMeldCsv(demoFollowUpCsv);
  const baseline = reconcile(createEmptyState(), baselineRows, {
    uploadedAt: "2026-07-10T12:00:00.000Z",
    batchId: "qa-baseline",
    filename: "qa-baseline.csv"
  });
  const followUp = reconcile(baseline.state, followUpRows, {
    uploadedAt: "2026-07-11T12:00:00.000Z",
    batchId: "qa-follow-up",
    filename: "qa-follow-up.csv"
  });

  checks.push(check("Demo baseline", baselineRows.length === 6, `${baselineRows.length} synthetic rows parsed`));
  checks.push(
    check(
      "Follow-up preview",
      followUp.batch.newCount === 1 && followUp.batch.statusChangedCount === 2 && followUp.batch.staleCount === 1,
      `${followUp.batch.newCount} new, ${followUp.batch.statusChangedCount} changed, ${followUp.batch.staleCount} stale`
    )
  );
  checks.push(
    check(
      "Cancel-safe state",
      Object.keys(baseline.state.records).length === 6 && baseline.state.imports.length === 1,
      "Baseline remains unchanged before commit"
    )
  );
  checks.push(
    check(
      "Commit state",
      Object.keys(followUp.state.records).length === 7 && followUp.state.imports.length === 2,
      `${Object.keys(followUp.state.records).length} records after follow-up`
    )
  );

  const manuallyCorrected = setManualStatus(baseline.state, "MS-1001", "Completed", "2026-07-10T13:00:00.000Z");
  const afterManualImport = reconcile(manuallyCorrected, followUpRows, {
    uploadedAt: "2026-07-11T12:00:00.000Z",
    batchId: "qa-manual-follow-up",
    filename: "qa-follow-up.csv"
  });
  checks.push(
    check(
      "Sticky manual override",
      afterManualImport.state.records["MS-1001"].currentStatus === "Completed" &&
        afterManualImport.state.records["MS-1001"].statusSource === "manual",
      "Manual completion survives imported pending status"
    )
  );

  const linked = setLinkedRecord(followUp.state, "MS-1001", "MS-1002");
  checks.push(
    check(
      "Linked resolution",
      effectiveStatus(linked.records["MS-1001"], linked.records) === "Completed" &&
        isLinkedResolved(linked.records["MS-1001"], linked.records),
      "Original ticket resolves through completed follow-up"
    )
  );

  checks.push(
    check(
      "Backup shape",
      Boolean(followUp.state.records && Array.isArray(followUp.state.history) && Array.isArray(followUp.state.imports)),
      "Records, history, and imports are serializable"
    )
  );

  return {
    passed: checks.filter((item) => item.passed).length,
    total: checks.length,
    checks
  };
}

export function getDemoWalkthrough(qaReport = runDemoQa()) {
  const checksByLabel = new Map(qaReport.checks.map((item) => [item.label, item]));

  return DEMO_WALKTHROUGH_STEPS.map((step, index) => {
    const checkResult = checksByLabel.get(step.qaCheck);
    return {
      ...step,
      number: index + 1,
      passed: Boolean(checkResult?.passed),
      detail: checkResult?.detail || "Not checked"
    };
  });
}

function check(label, passed, detail) {
  return {
    label,
    passed,
    detail
  };
}
