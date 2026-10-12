import { describe, expect, it } from "vitest";
import { parseMarginText, serializeMarginText } from "@/app/marginText";
import { createDefaultFooter } from "@/core/ir/factory";

describe("margin text tokens", () => {
  it("round-trips structured margin boxes", () => {
    const footer = createDefaultFooter();
    const tokens = serializeMarginText(footer);
    expect(tokens).toBe("Page [pageNumber] of [pageCount]");
    expect(parseMarginText(tokens)).toEqual(footer);
  });

  it("keeps field parts adjacent to text", () => {
    const box = parseMarginText("[docNumber] · [title]");
    expect(box).toEqual({
      parts: [
        { kind: "field", field: "docNumber" },
        { kind: "text", value: " · " },
        { kind: "field", field: "title" },
      ],
    });
    expect(serializeMarginText(box)).toBe("[docNumber] · [title]");
  });

  it("treats empty input as no margin box", () => {
    expect(parseMarginText("")).toBeNull();
    expect(serializeMarginText(null)).toBe("");
  });

  it("keeps literal brackets that are not field tokens", () => {
    expect(parseMarginText("see [note] here")).toEqual({
      parts: [{ kind: "text", value: "see [note] here" }],
    });
  });

  it("round-trips the M5 margin fields (review date, status, laboratory)", () => {
    const tokens = "[reviewDate] · [status] · [laboratoryName]";
    const box = parseMarginText(tokens);
    expect(box).toEqual({
      parts: [
        { kind: "field", field: "reviewDate" },
        { kind: "text", value: " · " },
        { kind: "field", field: "status" },
        { kind: "text", value: " · " },
        { kind: "field", field: "laboratoryName" },
      ],
    });
    expect(serializeMarginText(box)).toBe(tokens);
  });

  it("normalizes the legacy [page]/[count] aliases to canonical tokens on parse", () => {
    const box = parseMarginText("Page [page] of [count]");
    expect(box).toEqual({
      parts: [
        { kind: "text", value: "Page " },
        { kind: "field", field: "pageNumber" },
        { kind: "text", value: " of " },
        { kind: "field", field: "pageCount" },
      ],
    });
    // Serialization always emits the canonical tokens (stable stored model).
    expect(serializeMarginText(box)).toBe("Page [pageNumber] of [pageCount]");
  });
});
