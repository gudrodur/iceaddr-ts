# iceaddr-ts (stadfangaskra)

A zero-dependency, edge-native TypeScript port of the data layer of Sveinbjörn Þórðarson's
Python `iceaddr`: Icelandic address registry (Staðfangaskrá) parsing, validation, search and
postcode lookup that runs in Node, Cloudflare Workers, Deno or Bun without a database. The
package ships no address data — it fetches the public HMS export at runtime. Public.

## Stack and entry points

- TypeScript, pnpm, tsdown (build), vitest (test), oxlint/oxfmt.
- `src/core.ts` — CSV parsing and cleaning; `src/fetch.ts` — the live registry;
  `src/lookup.ts` — the in-memory index; `src/postcodes.ts` — the one bundled dataset;
  `src/index.ts` — the public surface.
- `docs/design.md` — the Postgres/pg_trgm production shape; `NOTICE.md` — attribution.

## Build, test and run

```sh
pnpm install
pnpm build          # tsdown → dist/
pnpm check          # lint + typecheck + test (what CI runs)
pnpm test
```

CI (`.github/workflows/ci.yml`) runs install, lint, format check, typecheck, test and build;
`live-values.yml` checks `scripts/live-values.mjs`. Verified here:
`node scripts/live-values.mjs --check` → "2 marker(s); 2 ok, 0 drift". Not run here:
dependency install and the full suite were not part of this docs change; CI is the gate.

## Deploy and accounts

Nothing is deployed. Publishing to npm is a manual, owner-approved step documented in
`PUBLISHING.md` (the package was not on npm as of 2026-06-21). No cloud account.

## Rules

- Keep the package dependency-free at runtime and the core data-free.
- Do not bundle the address registry; fetch it, and keep the header validation that throws
  when the upstream CSV schema drifts.
- Postcode data is ported from `iceaddr` under BSD-3-Clause; attribution lives in `NOTICE.md`
  and travels with any redistribution.
- Node 18+; ESM and CJS both ship.
- `live-values.json` is a copied bundle from `agent-harness`; recopy it, never hand-edit it.

## Docs

`README.md`, `NOTICE.md`, `PUBLISHING.md`, `docs/design.md`,
`docs/outreach-sveinbjorn.md`.
