# Design note: porting Staðfangaskrá / `iceaddr` to TypeScript + the edge

This is the reverse-engineering write-up behind `iceaddr-ts`: where the data
comes from, which columns matter and why, the exact cleaning rules, the search
semantics, and the non-obvious gotcha that a copy-paste port would miss. It is
the part that took the time. The code is small; this knowledge is the value.

`iceaddr-ts` is a TypeScript port of the **data layer** of Sveinbjörn
Þórðarson's Python [`iceaddr`](https://github.com/sveinbjornt/iceaddr). Credit
for the original design — which columns to keep, the cleaning rules, the search
behaviour — is his; see [`NOTICE.md`](../NOTICE.md).

## Why this exists

`iceaddr` is Python with a bundled ~12 MB SQLite snapshot. On an edge / serverless
TypeScript stack (Cloudflare Workers, Deno, Bun, Vercel, Node) there is **no
equivalent** — anyone building an Icelandic signup or address autocomplete there
hits a wall: no Python, no native SQLite in the runtime's shape. The expensive,
non-obvious knowledge is not the code, it is:

- the live upstream URLs and that they are public / no-auth / CC-BY;
- the 13-of-29 column subset `iceaddr` keeps, and why;
- the cleaning rules (comma-decimal, Iceland-bbox Haversine skip, postcode-set filter, lower-cased letter);
- the dual nominative + dative search and the house-number-prefix UX;
- the `DISTINCT ON (hnitnum)` dedup that a naive load gets wrong.

## Upstream data sources

`iceaddr` is a thin wrapper over public Icelandic open-data sources; its
`build_db.py` / `build_postcodes.py` are the canonical build pipeline. The two
that matter for address lookup:

### 1. Staðfangaskrá (the address registry)

| Property | Value |
|---|---|
| URL | `https://hmsstgsftpprodweu001.blob.core.windows.net/fasteignaskra/Stadfangaskra.csv` |
| Host | HMS (Húsnæðis- og mannvirkjastofnun) Azure Blob Storage |
| Auth | **None** — public read |
| Size | ~38 MB, ~139k rows, UTF-8, comma-delimited |
| Refresh | `Last-Modified` moves at least daily upstream |
| License | **CC-BY 4.0** ([opingogn.is/dataset/stadfangaskra](https://opingogn.is/dataset/stadfangaskra)) |
| Attribution | "Staðfangaskrá by HMS / Þjóðskrá Íslands, CC-BY 4.0" — owed by whoever fetches the data |

`iceaddr-ts` ships **no address data**: `streamStadfangaskra()` / `loadStadfangaskra()`
fetch this CSV live, so the CC-BY redistribution obligation falls on the consumer,
not on the package.

The CSV header is **29 columns**; `iceaddr` keeps **13** (marked `*`), and so do we:

```
FID, HNITNUM*, SVFNR*, BYGGD*, LANDNR*, HEINUM*, MATSNR, POSTNR*,
HEITI_NF*, HEITI_TGF*, HUSNR*, BOKST*, VIDSK*, SERHEITI*,
DAGS_INN, DAGS_LEIDR, GAGNA_EIGN, TEGHNIT, YFIRFARID, YFIRF_HEITI,
ATH, NAKV_XY, HNIT, N_HNIT_WGS84*, E_HNIT_WGS84*,
NOTNR, LM_HEIMILISFANG, VEF_BIRTING, HUSMERKING
```

`validateHeader()` checks the parsed header against this exact list and reports the
first mismatch, so an upstream schema change aborts a refresh instead of silently
corrupting data. `N_HNIT_WGS84` is latitude (north), `E_HNIT_WGS84` is longitude
(east), with **Icelandic comma decimals** that must be converted to `.` before parse.

**`hnitnum` vs `heinum` (important).** `HNITNUM` is the *coordinate-point* id and is
**not unique per address** — one address can have several points. `HEINUM` is the
*address* id (staðfanga-/heitinúmer), the stable key to join with HMS and other public
datasets. `iceaddr-ts` carries both on `CleanAddress` (the `heinum` field tracks
[iceaddr#16](https://github.com/sveinbjornt/iceaddr/pull/16) by Jökull Sólberg).

### 2. Postcodes (postur.is)

`iceaddr` ships **195 static postcode entries** baked into `postcodes.py`, with both
nominative (`stadur_nf`) and dative (`stadur_tgf`) place names plus region info. The
dative comes from postur.is; the nominative declension was produced once by `iceaddr`
using Miðeind's GreynirPackage (a non-trivial Icelandic grammar step). `iceaddr-ts`
re-bundles that table as the opt-in `iceaddr-ts/postcodes` export — kept out of the
zero-data core so the parser stays pure. Postcodes change on a scale of decades, so a
static table is correct; no runtime call to postur.is.

## Cleaning rules (replicated from `iceaddr`)

`cleanAddressRow(fields, knownPostcodes)` applies exactly what `iceaddr` does:

- strip every field;
- comma → dot for decimals before float parse;
- coerce the int fields (`HNITNUM`, `HEINUM`, `SVFNR`, `BYGGD`, `LANDNR`, `POSTNR`, `HUSNR`); empty → `null`;
- coerce lat/lng to float; empty → `null`;
- lower-case the house letter (`BOKST`);
- **skip** rows whose coordinates are outside Iceland (Haversine > 800 km from `(64.9957, -18.5739)`);
- **skip** rows whose postcode is not in the caller-supplied known-postcode set.

The known-postcode set is a **parameter**, not bundled into the core — the caller
supplies it (e.g. from `iceaddr-ts/postcodes`' `knownPostcodes`, or their own table).

## Search & validation semantics

- **Query parser.** `parseAddressQuery("Njálsgata 8C")` → `{ street: "Njálsgata", number: 8, letter: "c" }`, but `"Njálsgata"` stays whole. The regex `^([^\d]+?)(?:\s+(\d+)([a-zA-Z]?))?$` mirrors `iceaddr`'s. Without it, autocomplete misses any query containing a number.
- **House-number prefix matching.** Typing `"Gullengi 3"` should return `3, 31, 33, 35, …`, not just `3` — a prefix match on the stringified house number. Invisible until missing.
- **Dual nominative + dative.** Icelandic users type both `"Öldugata"` and `"Öldugötu"`, so both `HEITI_NF` and `HEITI_TGF` are kept and searched.

`createAddressIndex(addresses)` builds an in-memory index with `.search()`,
`.validate()`, and `.lookupByHnitnum()` for scripts, edge functions with the dataset
in memory/KV, and tests.

## Reference: a Postgres-resident service

For high query volumes the in-memory index is not the scalable shape. The
reference production deployment loads the cleaned records into Postgres and serves
autocomplete via a `pg_trgm` trigram index, with a weekly refresh job. That design is
meant to be **copied and adapted, not consumed as a library** (it couples to
Postgres + your runtime's cron/object-store), so it lives here as a worked example
rather than in the package.

### Schema shape

- `icelandic_addresses` (the 13 kept columns + `refreshed_at`); city/region resolved
  from the postcode table, municipality from the `svfnr` code.
- A singleton `*_meta` row holding `last_etag` / `last_modified` / `last_row_count`
  for the conditional-fetch optimisation.
- Indexes: GIN trigram on both `street_nf` and `street_tgf` (autocomplete), a
  B-tree on `(street_nf, house_number, postal_code)` (strict validation).

### Refresh pipeline

A weekly cron (most weeks a no-op):

1. **Conditional `HEAD`** on the CSV URL; if `ETag` / `Last-Modified` match the stored
   meta row, exit early — no download, no writes.
2. On change, **`GET` and stream** the CSV (do not buffer the whole body).
3. **Validate the header** (29 columns, exact names); abort + alert on drift.
4. Stream rows through `cleanAddressRow` into a **staging table** (batched inserts).
5. **Row-count sanity check** — abort if the count moved more than ~5% vs the last
   refresh (catches upstream truncation / partial downloads).
6. **Atomic swap** in one transaction (`TRUNCATE` + `INSERT … SELECT`), so previous
   data stays live until commit and a mid-job failure changes nothing.
7. Update the meta row; optionally archive the snapshot.

A streaming implementation can `tee()` the single download into two branches — one
gzips straight to an object-store archive, the other into the parser — archiving and
ingesting in one pass. (Note: object stores that need a known content length, e.g.
Cloudflare R2, want the gzip output buffered to a known-length body before the put,
not a piped stream of unknown length.)

### The hard-won gotcha: `DISTINCT ON (hnitnum)`

**`HNITNUM` is not unique in the raw CSV.** A naive `PRIMARY KEY (hnitnum)` load
fails on duplicate rows. The atomic swap must dedup:

```sql
INSERT INTO icelandic_addresses (…)
SELECT DISTINCT ON (hnitnum) …
FROM   icelandic_addresses_staging
ORDER  BY hnitnum;
```

`iceaddr` never hit this because SQLite `INSERT OR REPLACE` papers over duplicates on
its in-place rebuild; a set-based Postgres swap does not, so the dedup is explicit.
This is the single biggest detail a copy-paste port gets wrong. (With `heinum` now
available, dedup on the address id is the more correct key going forward.)

## Credit & license

`iceaddr-ts` is MIT. It is a **derivative-in-spirit** of Sveinbjörn Þórðarson's
`iceaddr` — re-implementing its semantics and reusing its build-pipeline knowledge —
and the postcode table is ported from `iceaddr` (BSD-3-Clause, copyright notice kept
in [`NOTICE.md`](../NOTICE.md)). The runtime-fetched address data is CC-BY 4.0; the
attribution is owed by whoever fetches it.
