// In-memory address lookup over a set of CleanAddress records — the pure-TS
// equivalent of iceaddr's `iceaddr_lookup` / `iceaddr_suggest`, with no database
// required. Mirrors the semantics of the Postgres-backed reference service
// (search by partial street with house-number prefix matching, strict tuple
// validation, direct lookup by hnitnum) so behaviour matches iceaddr. For very
// high query volumes, a Postgres + pg_trgm index is the scalable path; this is
// ideal for scripts, Workers with the dataset in memory/KV, and tests.

import { type CleanAddress, parseAddressQuery } from "./core.ts";
import { POSTCODES } from "./postcodes.ts";

export interface AddressLookupResult extends CleanAddress {
  /** Place name (nominative) resolved from the bundled postcode table. */
  city: string | null;
  /** Region (nominative) resolved from the bundled postcode table. */
  region: string | null;
  /** Human-readable single line, e.g. `"Njálsgata 8c, 101 Reykjavík"`. */
  display: string;
}

export interface SearchOptions {
  /** Max results (default 100, capped at 500), matching iceaddr's bounds. */
  limit?: number;
}

export interface ValidateInput {
  /** Street name in nominative case (`heiti_nf`). */
  street: string;
  houseNumber?: number | null;
  houseLetter?: string | null;
  /** Three-digit postcode, e.g. `"101"`. */
  postalCode: string;
}

const SEARCH_DEFAULT_LIMIT = 100;
const SEARCH_MAX_LIMIT = 500;

function toResult(row: CleanAddress): AddressLookupResult {
  const pc = POSTCODES[row.postalCode];
  const city = pc?.nominative ?? null;
  const region = pc?.region ?? null;
  const house = row.houseNumber === null ? "" : ` ${row.houseNumber}${row.houseLetter ?? ""}`;
  const place = [row.postalCode, city].filter(Boolean).join(" ");
  const display = `${row.streetNf}${house}${place ? `, ${place}` : ""}`;
  return { ...row, city, region, display };
}

// Deterministic ordering: street (code-point), then house number, then letter.
// Code-point order avoids relying on ICU collation, which is limited on some
// edge runtimes.
function compareAddress(a: CleanAddress, b: CleanAddress): number {
  if (a.streetNf !== b.streetNf) return a.streetNf < b.streetNf ? -1 : 1;
  const an = a.houseNumber ?? 0;
  const bn = b.houseNumber ?? 0;
  if (an !== bn) return an - bn;
  const al = a.houseLetter ?? "";
  const bl = b.houseLetter ?? "";
  return al < bl ? -1 : al > bl ? 1 : 0;
}

interface IndexedRow {
  row: CleanAddress;
  nf: string;
  tgf: string;
}

/**
 * A searchable in-memory view over address records. Build once with
 * {@link createAddressIndex}, then call {@link AddressIndex.search} /
 * {@link AddressIndex.validate} / {@link AddressIndex.lookupByHnitnum}.
 */
export class AddressIndex {
  private readonly rows: IndexedRow[] = [];
  private readonly byHnitnum = new Map<number, CleanAddress>();

  constructor(addresses: Iterable<CleanAddress>) {
    for (const row of addresses) {
      this.rows.push({
        row,
        nf: row.streetNf.toLowerCase(),
        tgf: (row.streetTgf ?? "").toLowerCase(),
      });
      this.byHnitnum.set(row.hnitnum, row);
    }
  }

  /** Number of indexed addresses. */
  get size(): number {
    return this.rows.length;
  }

  /**
   * Autocomplete by partial query. Mirrors `iceaddr_lookup(street, limit)`:
   * prefix match on both the nominative and dative street forms, house-number
   * **prefix** matching (`"Gullengi 3"` → 3, 31, 33, …), optional letter exact
   * match, ordered by street then number.
   */
  search(query: string, opts: SearchOptions = {}): AddressLookupResult[] {
    const parsed = parseAddressQuery(query);
    if (parsed.street.length === 0) return [];
    const prefix = parsed.street.toLowerCase();
    const numPrefix = parsed.number === null ? null : String(parsed.number);
    const cap = Math.min(Math.max(opts.limit ?? SEARCH_DEFAULT_LIMIT, 1), SEARCH_MAX_LIMIT);

    const matches: CleanAddress[] = [];
    for (const { row, nf, tgf } of this.rows) {
      if (!nf.startsWith(prefix) && !tgf.startsWith(prefix)) continue;
      if (numPrefix !== null) {
        if (row.houseNumber === null || !String(row.houseNumber).startsWith(numPrefix)) continue;
      }
      if (parsed.letter !== null && (row.houseLetter ?? null) !== parsed.letter) continue;
      matches.push(row);
    }
    matches.sort(compareAddress);
    return matches.slice(0, cap).map(toResult);
  }

  /**
   * Strict validation. Mirrors `iceaddr_lookup(street, husnr, bokst, postnr)`:
   * an exact match on the (nominative street, number, letter, postcode) tuple.
   * The house letter is compared case-insensitively.
   */
  validate(input: ValidateInput): AddressLookupResult | null {
    const houseNumber = input.houseNumber ?? null;
    const houseLetter = input.houseLetter == null ? null : input.houseLetter.toLowerCase();
    for (const { row } of this.rows) {
      if (row.streetNf !== input.street) continue;
      if (row.postalCode !== input.postalCode) continue;
      if ((row.houseNumber ?? null) !== houseNumber) continue;
      if ((row.houseLetter ?? null) !== houseLetter) continue;
      return toResult(row);
    }
    return null;
  }

  /** Direct lookup by `hnitnum` (the registry's unique address-point id). */
  lookupByHnitnum(hnitnum: number): AddressLookupResult | null {
    const row = this.byHnitnum.get(hnitnum);
    return row ? toResult(row) : null;
  }
}

/** Build an {@link AddressIndex} from any iterable of address records. */
export function createAddressIndex(addresses: Iterable<CleanAddress>): AddressIndex {
  return new AddressIndex(addresses);
}
