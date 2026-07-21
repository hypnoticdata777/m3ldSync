import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  getPortfolioHandoff,
  normalizePresetId,
  portfolioRouteForPreset,
  PORTFOLIO_BOUNDARY_RULES,
  PORTFOLIO_PRESETS
} from "../src/portfolioHandoff.js";

test("portfolio handoff exposes public-only preset routes", () => {
  const handoff = getPortfolioHandoff("https://portfolio.example/meldsync/");

  assert.equal(handoff.safeSurface, "Public Demo Portfolio View");
  assert.deepEqual(
    handoff.presets.map((preset) => preset.id),
    ["baseline", "followup", "sticky", "linked"]
  );
  assert.equal(handoff.presets[1].route, "https://portfolio.example/meldsync/?view=portfolio&preset=followup");
  assert.equal(handoff.presets.every((preset) => preset.route.includes("view=portfolio")), true);
  assert.equal(handoff.presets.every((preset) => !preset.route.includes("owner")), true);
  assert.deepEqual(handoff.boundaryRules, PORTFOLIO_BOUNDARY_RULES);
});

test("portfolio preset ids normalize to baseline when unknown", () => {
  assert.equal(normalizePresetId("sticky"), "sticky");
  assert.equal(normalizePresetId("nope"), "baseline");
  assert.equal(portfolioRouteForPreset("nope"), "?view=portfolio&preset=baseline");
});

test("portfolio manifest matches source handoff constants", async () => {
  const manifest = JSON.parse(await readFile("docs/portfolio/manifest.json", "utf8"));

  assert.equal(manifest.safeSurface, "Public Demo Portfolio View");
  assert.deepEqual(manifest.boundaryRules, PORTFOLIO_BOUNDARY_RULES);
  assert.deepEqual(
    manifest.presets.map((preset) => preset.id),
    PORTFOLIO_PRESETS.map((preset) => preset.id)
  );
  assert.deepEqual(
    manifest.presets.map((preset) => preset.screenshot),
    PORTFOLIO_PRESETS.map((preset) => preset.screenshot)
  );
});
