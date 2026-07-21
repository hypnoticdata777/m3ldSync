export const PORTFOLIO_PRESETS = [
  {
    id: "baseline",
    label: "Baseline",
    detail: "Clean synthetic portfolio",
    screenshot: "docs/portfolio/meldsync-portfolio-baseline.png"
  },
  {
    id: "followup",
    label: "Follow-Up Signal",
    detail: "Preview import impact",
    screenshot: "docs/portfolio/meldsync-portfolio-follow-up-signal.png"
  },
  {
    id: "sticky",
    label: "Sticky Manual",
    detail: "Manual truth survives",
    screenshot: "docs/portfolio/meldsync-portfolio-sticky-manual.png"
  },
  {
    id: "linked",
    label: "Linked Resolution",
    detail: "Follow-up closes original",
    screenshot: "docs/portfolio/meldsync-portfolio-linked-resolution.png"
  }
];

export const PORTFOLIO_HERO_SCREENSHOT = "docs/portfolio/meldsync-portfolio-hero.png";

export const PORTFOLIO_BOUNDARY_RULES = [
  "Public Demo only",
  "Synthetic data only",
  "Owner tools hidden",
  "Hosted owner auth deferred"
];

export function normalizePresetId(presetId) {
  return PORTFOLIO_PRESETS.some((preset) => preset.id === presetId) ? presetId : "baseline";
}

export function portfolioRouteForPreset(presetId = "baseline", basePath = "") {
  const normalizedPresetId = normalizePresetId(presetId);
  const routeBase = basePath || "";
  const separator = routeBase.includes("?") ? "&" : "?";
  return `${routeBase}${separator}view=portfolio&preset=${encodeURIComponent(normalizedPresetId)}`;
}

export function getPortfolioHandoff(basePath = "") {
  return {
    safeSurface: "Public Demo Portfolio View",
    heroScreenshot: PORTFOLIO_HERO_SCREENSHOT,
    boundaryRules: PORTFOLIO_BOUNDARY_RULES,
    presets: PORTFOLIO_PRESETS.map((preset) => ({
      ...preset,
      route: portfolioRouteForPreset(preset.id, basePath)
    }))
  };
}
