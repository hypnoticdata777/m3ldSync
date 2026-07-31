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
  "Owner switch hidden",
  "Hosted owner auth deferred"
];

export const PORTFOLIO_PROJECT_CARD = {
  name: "MeldSync",
  category: "Property operations reconciliation",
  headline: "Recurring work-order memory for messy maintenance exports.",
  summary:
    "MeldSync compares repeated Property Meld-style exports against prior snapshots, flags what changed, preserves manual verification, and turns stale work into a review queue.",
  status: "Synthetic public demo ready",
  primaryPreset: "followup",
  primaryCta: "Open synthetic demo",
  secondaryCta: "View proof states"
};

export const PORTFOLIO_COPY = {
  proofBullets: [
    "Detects new, changed, and stale work orders across recurring exports.",
    "Keeps owner-verified manual status from being overwritten by later imports.",
    "Links follow-up tickets so original work can be treated as effectively resolved.",
    "Ranks property risk by open work, stale records, high priority, and age.",
    "Supports Owner CSV, text PDF, compressed PDF, and scanned-PDF OCR imports locally."
  ],
  privacyCaption:
    "Public Demo uses synthetic data only. Owner imports, backups, restored data, and private browser storage stay out of the hosted portfolio surface.",
  ocrCaveat:
    "OCR quality depends on scan clarity. Clear, upright table scans work best; blurry or rotated PDFs may need cleaner export or later OCR tuning."
};

export const PORTFOLIO_INTEGRATION_RULES = {
  embedTarget: "Portfolio project card or case-study section",
  safeRouteRequirement: "Always include surface=public and view=portfolio",
  ownerHostingStatus: "Deferred until backend auth and protected storage exist",
  forbiddenPublicContent: [
    "Real Property Meld exports",
    "Real backup JSON files",
    "Owner import controls",
    "Private property, tenant, vendor, or unit identifiers"
  ]
};

export function normalizePresetId(presetId) {
  return PORTFOLIO_PRESETS.some((preset) => preset.id === presetId) ? presetId : "baseline";
}

export function portfolioRouteForPreset(presetId = "baseline", basePath = "") {
  const normalizedPresetId = normalizePresetId(presetId);
  const routeBase = basePath || "";
  const separator = routeBase.includes("?") ? "&" : "?";
  return `${routeBase}${separator}surface=public&view=portfolio&preset=${encodeURIComponent(normalizedPresetId)}`;
}

export function getPortfolioHandoff(basePath = "") {
  return {
    safeSurface: "Public Demo Portfolio View",
    projectCard: {
      ...PORTFOLIO_PROJECT_CARD,
      primaryRoute: portfolioRouteForPreset(PORTFOLIO_PROJECT_CARD.primaryPreset, basePath)
    },
    copy: PORTFOLIO_COPY,
    integrationRules: PORTFOLIO_INTEGRATION_RULES,
    heroScreenshot: PORTFOLIO_HERO_SCREENSHOT,
    boundaryRules: PORTFOLIO_BOUNDARY_RULES,
    presets: PORTFOLIO_PRESETS.map((preset) => ({
      ...preset,
      route: portfolioRouteForPreset(preset.id, basePath)
    }))
  };
}
