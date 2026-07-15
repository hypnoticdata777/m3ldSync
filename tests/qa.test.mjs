import assert from "node:assert/strict";
import test from "node:test";
import { DEMO_WALKTHROUGH_STEPS, getDemoWalkthrough, runDemoQa } from "../src/qa.js";

test("demo QA scenario passes all checks", () => {
  const result = runDemoQa();

  assert.equal(result.passed, result.total);
  assert.equal(result.total, 7);
  assert.deepEqual(
    result.checks.map((item) => item.label),
    [
      "Demo baseline",
      "Follow-up preview",
      "Cancel-safe state",
      "Commit state",
      "Sticky manual override",
      "Linked resolution",
      "Backup shape"
    ]
  );
});

test("demo walkthrough maps to QA checks", () => {
  const report = runDemoQa();
  const walkthrough = getDemoWalkthrough(report);

  assert.equal(walkthrough.length, DEMO_WALKTHROUGH_STEPS.length);
  assert.equal(walkthrough.every((step) => step.passed), true);
  assert.deepEqual(
    walkthrough.map((step) => step.number),
    [1, 2, 3, 4, 5, 6, 7]
  );
});
