# MeldSync Websuite Integration

Use this file when wiring MeldSync into the portfolio websuite landing page or project case-study section.

## Safe Surface

Use only Public Demo Portfolio View routes.

Required route parameters:

```text
surface=public
view=portfolio
preset={baseline|followup|sticky|linked}
```

Recommended primary CTA:

```text
?surface=public&view=portfolio&preset=followup
```

## Portfolio Card

Name:

```text
MeldSync
```

Category:

```text
Property operations reconciliation
```

Headline:

```text
Recurring work-order memory for messy maintenance exports.
```

Summary:

```text
MeldSync compares repeated Property Meld-style exports against prior snapshots, flags what changed, preserves manual verification, and turns stale work into a review queue.
```

Primary CTA:

```text
Open synthetic demo
```

Secondary CTA:

```text
View proof states
```

## Proof Bullets

- Detects new, changed, and stale work orders across recurring exports.
- Keeps owner-verified manual status from being overwritten by later imports.
- Links follow-up tickets so original work can be treated as effectively resolved.
- Ranks property risk by open work, stale records, high priority, and age.
- Supports Owner CSV, text PDF, compressed PDF, and scanned-PDF OCR imports locally.

## Privacy Caption

```text
Public Demo uses synthetic data only. Owner imports, backups, restored data, and private browser storage stay out of the hosted portfolio surface.
```

## OCR Caveat

```text
OCR quality depends on scan clarity. Clear, upright table scans work best; blurry or rotated PDFs may need cleaner export or later OCR tuning.
```

## Safe Assets

- `docs/portfolio/meldsync-portfolio-hero.png`
- `docs/portfolio/meldsync-portfolio-baseline.png`
- `docs/portfolio/meldsync-portfolio-follow-up-signal.png`
- `docs/portfolio/meldsync-portfolio-sticky-manual.png`
- `docs/portfolio/meldsync-portfolio-linked-resolution.png`
- `docs/portfolio/manifest.json`

## Do Not Include Publicly

- Real Property Meld exports.
- Real backup JSON files.
- Owner import controls.
- Private property, tenant, vendor, or unit identifiers.
- Hosted Owner mode links before backend auth and protected storage exist.

## Integration Rule

The portfolio websuite may link to locked public demo routes and show synthetic screenshots. It must not host or expose Owner mode until the backend auth gate is designed and implemented.
