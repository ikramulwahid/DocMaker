/**
 * Golden-document tests: committed JSON document in → layout HTML must match
 * the committed expected HTML byte-for-byte. Any rendering drift fails here
 * and can only land with an intentional regeneration (`pnpm golden:update`).
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { deserializeDocument } from "@/core/json/envelope";
import { renderLayout } from "@/core/layout";
import { resolveDocument } from "@/core/resolve";
import { GOLDEN_DIR, PAGED_JS_SRC, updateGoldens } from "./generator";

const updating = process.env.UPDATE_GOLDEN === "1";

function goldenNames(): string[] {
  return readdirSync(GOLDEN_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

beforeAll(() => {
  if (updating) updateGoldens();
});

describe("golden documents", () => {
  it("has at least two golden documents", () => {
    expect(goldenNames().length).toBeGreaterThanOrEqual(2);
  });

  for (const name of goldenNames()) {
    it(`${name}: JSON → resolve → layout matches expected HTML`, () => {
      const json = readFileSync(path.join(GOLDEN_DIR, `${name}.json`), "utf8");
      const expected = readFileSync(
        path.join(GOLDEN_DIR, `${name}.expected.html`),
        "utf8",
      );
      const doc = deserializeDocument(json);
      const html = renderLayout(resolveDocument(doc), { pagedJsSrc: PAGED_JS_SRC });
      expect(html).toBe(expected);
    });

    it(`${name}: round-trips through JSON without semantic loss`, () => {
      const json = readFileSync(path.join(GOLDEN_DIR, `${name}.json`), "utf8");
      const doc = deserializeDocument(json);
      expect(JSON.parse(json).document).toEqual(doc);
    });
  }
});
