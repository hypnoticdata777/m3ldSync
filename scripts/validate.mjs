import { spawnSync } from "node:child_process";

const commands = [
  ["node", ["--check", "src/main.js"]],
  ["node", ["--check", "src/domain.js"]],
  ["node", ["--check", "src/qa.js"]],
  ["node", ["--test", "tests/reconcile.test.mjs", "tests/qa.test.mjs"]]
];

let failed = false;

for (const [command, args] of commands) {
  const label = [command, ...args].join(" ");
  console.log(`\n> ${label}`);
  const result = spawnSync(command, args, {
    stdio: "inherit"
  });

  if (result.status !== 0) {
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log("\nValidation passed.");
