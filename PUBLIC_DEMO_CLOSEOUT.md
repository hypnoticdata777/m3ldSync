# MeldSync Public Demo Closeout

## Decision

MeldSync is ready to show as a synthetic public portfolio demo.

MeldSync is not ready to host as a private owner product.

## Safe Public Surface

Use only locked public Portfolio View routes from `docs/portfolio/manifest.json`.

Current route pattern:

```text
?surface=public&view=portfolio&preset={baseline|followup|sticky|linked}
```

These routes:

- Open Public Demo mode.
- Use synthetic data only.
- Hide private owner controls.
- Hide the Owner access switch.
- Hide workflow board chrome for clean portfolio presentation.
- Show screenshot/copy handoff assets for the portfolio websuite.

## Safe Assets

- `docs/portfolio/manifest.json`
- `docs/portfolio/meldsync-portfolio-hero.png`
- `docs/portfolio/meldsync-portfolio-baseline.png`
- `docs/portfolio/meldsync-portfolio-follow-up-signal.png`
- `docs/portfolio/meldsync-portfolio-sticky-manual.png`
- `docs/portfolio/meldsync-portfolio-linked-resolution.png`

## Stop Here For MeldSync Hosting

Do not host Owner mode yet.

Before Owner mode can be hosted, the product needs:

- Backend authentication.
- Server-side authorization.
- Protected private storage.
- Per-owner workspace isolation.
- A production backup/restore policy.
- A clear public/private route boundary.

## Next Project Step

Move to the portfolio websuite work.

Use the locked public route pattern and screenshot assets above when wiring MeldSync into the portfolio landing page. Keep real CSV imports, backups, restored data, and owner storage out of the hosted public surface.
