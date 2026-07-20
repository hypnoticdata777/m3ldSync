# MeldSync Deployment Readiness

## Current Decision

Hosted auth is deferred.

MeldSync may be shown publicly as a synthetic portfolio demo, but Owner mode must remain a local static POC until a backend exists.

## Safe To Show Now

- Public Demo with synthetic data.
- Portfolio View screenshots from `docs/portfolio`.
- Portfolio Copy snippets.
- Reconciliation, sticky manual override, stale detection, linked resolution, and aging-risk proof states.

## Not Safe To Host Yet

- Real Property Meld CSV imports.
- Local owner backups or restored backup data.
- Browser localStorage owner workspace as a shared or public data store.
- Owner mode as if it were authenticated.

## Required Before Hosting Owner Mode

- Backend authentication.
- Server-side authorization.
- Protected private storage.
- Per-owner workspace isolation.
- Production backup/restore policy.
- Clear public/private route boundary.

## Portfolio Websuite Rule

When MeldSync is connected to the portfolio websuite, link only to the synthetic Public Demo until the hosted Owner mode has real auth and protected storage.
