// Fetch + stream the Staðfangaskrá straight from the public HMS export. This is
// the "recipe made executable": the address data is downloaded from HMS at
// runtime and never redistributed by this package. Works in Node 18+ and in
// Cloudflare Workers (Web Streams + fetch + TextDecoderStream).

import { type CleanAddress, cleanAddressRow, parseCsvLine, validateHeader } from "./core.ts";
import { knownPostcodes as bundledKnownPostcodes } from "./postcodes.ts";

// Public, no-auth HMS (Húsnæðis- og mannvirkjastofnun) Azure Blob export of the
// full Icelandic address registry (~38 MB CSV, CC-BY 4.0).
export const STADFANGASKRA_URL =
  "https://hmsstgsftpprodweu001.blob.core.windows.net/fasteignaskra/Stadfangaskra.csv";

export interface StreamOptions {
  /** Override the source URL (defaults to the public HMS export). */
  url?: string;
  /** Inject a fetch implementation (e.g. a mock, or a Workers binding). */
  fetch?: typeof fetch;
  /**
   * Known postcodes used to filter address rows. Defaults to the bundled
   * postcode set — pass your own to use a different/leaner list.
   */
  knownPostcodes?: Set<string>;
  /** Abort signal forwarded to the underlying fetch. */
  signal?: AbortSignal;
}

/**
 * Stream the Staðfangaskrá as cleaned, typed {@link CleanAddress} records.
 * Validates the upstream CSV header first and throws if it has drifted, so a
 * silent upstream schema change can't corrupt your data.
 */
export async function* streamStadfangaskra(opts: StreamOptions = {}): AsyncGenerator<CleanAddress> {
  const doFetch = opts.fetch ?? fetch;
  const url = opts.url ?? STADFANGASKRA_URL;
  const known = opts.knownPostcodes ?? bundledKnownPostcodes();

  const res = await doFetch(url, { signal: opts.signal });
  if (!res.ok || !res.body) {
    throw new Error(`Failed to fetch Staðfangaskrá (${url}): HTTP ${res.status}`);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let partial = "";
  let header: string[] | null = null;

  function* handleLine(line: string): Generator<CleanAddress> {
    if (header === null) {
      header = parseCsvLine(line);
      const err = validateHeader(header);
      if (err) throw new Error(`Unexpected Staðfangaskrá header: ${err}`);
      return;
    }
    if (line.trim() === "") return;
    const cleaned = cleanAddressRow(parseCsvLine(line), known);
    if (cleaned) yield cleaned;
  }

  for (;;) {
    // Reading a stream is inherently sequential (backpressure) — Promise.all
    // does not apply here.
    // oxlint-disable-next-line no-await-in-loop
    const { done, value } = await reader.read();
    if (done) break;
    partial += value;
    let nl: number;
    while ((nl = partial.indexOf("\n")) !== -1) {
      const line = partial.slice(0, nl).replace(/\r$/, "");
      partial = partial.slice(nl + 1);
      yield* handleLine(line);
    }
  }
  if (partial.length > 0) yield* handleLine(partial.replace(/\r$/, ""));
}

/**
 * Convenience wrapper that collects {@link streamStadfangaskra} into an array —
 * ~139k records, a few MB in memory. For repeated lookups, feed the result to
 * {@link createAddressIndex}.
 */
export async function loadStadfangaskra(opts?: StreamOptions): Promise<CleanAddress[]> {
  const out: CleanAddress[] = [];
  for await (const row of streamStadfangaskra(opts)) {
    out.push(row);
  }
  return out;
}
