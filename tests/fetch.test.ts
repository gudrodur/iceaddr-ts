import { describe, expect, it } from "vitest";
import { EXPECTED_HEADER } from "../src/core.ts";
import { loadStadfangaskra } from "../src/fetch.ts";

// Build a valid 29-column data row with only the fields we read populated.
function csvRow(fields: Record<number, string>): string {
  const f = Array.from({ length: 29 }, () => "");
  return Object.assign(f, fields).join(",");
}

const HEADER = EXPECTED_HEADER.join(",");

function mockFetchReturning(body: string): typeof fetch {
  return (async () => new Response(body)) as unknown as typeof fetch;
}

describe("loadStadfangaskra", () => {
  it("streams, validates the header, cleans + filters rows", async () => {
    const csv = [
      HEADER,
      csvRow({ 1: "10001414", 7: "101", 8: "Njálsgata", 9: "Njálsgötu", 10: "8", 11: "c" }),
      csvRow({ 1: "10001415", 7: "999", 8: "Hvergi", 9: "Hvergi", 10: "1" }), // unknown postcode → dropped
      csvRow({ 1: "10001416", 7: "112", 8: "Gullengi", 9: "Gullengi", 10: "3" }),
    ].join("\n");

    const rows = await loadStadfangaskra({
      fetch: mockFetchReturning(csv),
      knownPostcodes: new Set(["101", "112"]),
    });

    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.streetNf)).toEqual(["Njálsgata", "Gullengi"]);
    expect(rows[0]?.houseLetter).toBe("c");
  });

  it("throws when the upstream header has drifted", async () => {
    const badHeader = HEADER.replace("HEITI_NF", "STREET_NAME");
    await expect(
      loadStadfangaskra({
        fetch: mockFetchReturning(`${badHeader}\n`),
        knownPostcodes: new Set(["101"]),
      }),
    ).rejects.toThrow(/header/i);
  });
});
