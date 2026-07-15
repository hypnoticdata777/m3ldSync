import assert from "node:assert/strict";
import test from "node:test";
import { runDemoQa } from "../src/qa.js";

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

