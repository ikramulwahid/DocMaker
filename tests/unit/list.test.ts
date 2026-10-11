/**
 * M3 — canonical lists and multilevel numbering (V1-LIST-001..004).
 *
 * Covers the whole vertical slice: the recursive `list` IR + validation, the
 * lossless legacy-`bulletList` normalization, the derived (never stored)
 * ordinals, the shared layout rendering, and the render-boundary safety net.
 */
import { describe, expect, it } from "vitest";
import {
  blockSchema,
  documentSchema,
  EMPTY_PARAGRAPH_FORMAT,
  type Block,
  type List,
  type ListItem,
  type Paragraph,
} from "@/core/ir/schema";
import {
  createList,
  createListItem,
  createEmptyDocument,
  createHeading,
  createSection,
  createTable,
  text,
} from "@/core/ir/factory";
import { createDocumentFixture } from "./fixtures";
import { deriveNumbering } from "@/core/numbering";
import { resolveDocument } from "@/core/resolve";
import { blockHtml } from "@/core/layout";
import { hasLegacyLists, normalizeLegacyLists } from "@/core/ir/normalize";
import { serializeDocument, deserializeDocument } from "@/core/json/envelope";

/* --------------------------------------------------------------- helpers */

function para(id: string, value: string): Paragraph {
  return {
    id,
    type: "paragraph",
    content: [{ text: value, marks: [] }],
    style: null,
    format: EMPTY_PARAGRAPH_FORMAT,
  };
}

function li(id: string, value: string, children: ListItem[] = []): ListItem {
  return { id, content: [para(`pg_${id.slice(3)}`, value)], children };
}

function ordered(listType: List["listType"], items: ListItem[], start = 1): List {
  return { id: "bl_00000001", type: "list", listType, marker: null, start, items };
}

function resolvedWith(blocks: Block[]) {
  const doc = createEmptyDocument("lists");
  doc.sections = [createSection(blocks)];
  const resolved = resolveDocument(doc);
  return { doc, resolved, blocks: resolved.document.sections[0].blocks };
}

/* ---------------------------------------------------------- schema / IR */

describe("canonical list IR (V1-LIST-001)", () => {
  it("factories produce schema-valid bullet and numbered lists", () => {
    for (const listType of [
      "bullet",
      "decimal",
      "lower-alpha",
      "upper-alpha",
      "lower-roman",
      "upper-roman",
    ] as const) {
      const list = createList({ listType, items: [createListItem([text("x")])] });
      expect(() => blockSchema.parse(list)).not.toThrow();
      if (listType === "bullet") {
        expect(list.marker).toBe("disc");
        expect(list.start).toBe(1);
      } else {
        expect(list.marker).toBeNull();
      }
    }
  });

  it("rejects a bullet marker on a numbered list", () => {
    const bad = { ...ordered("decimal", []), marker: "disc" };
    const result = blockSchema.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("marker");
    }
  });

  it("rejects unknown list types, markers, and invalid starts", () => {
    expect(blockSchema.safeParse({ ...ordered("decimal", []), listType: "glyphs" }).success).toBe(false);
    expect(
      blockSchema.safeParse({ ...createList(), marker: "explosion" }).success,
    ).toBe(false);
    expect(blockSchema.safeParse(ordered("decimal", [], 0)).success).toBe(false);
    expect(blockSchema.safeParse(ordered("decimal", [], 1.5)).success).toBe(false);
  });

  it("gives items stable ids independent of visible numbering", () => {
    const list = createList({ items: [createListItem(), createListItem()] });
    for (const item of list.items) expect(item.id).toMatch(/^li_[a-z0-9]{6,24}$/);
    // Reordering never changes identity: ids are not ordinals.
    const reversed = [...list.items].reverse();
    expect(reversed.map((i) => i.id).sort()).toEqual(list.items.map((i) => i.id).sort());
  });

  it("keeps ordinals out of the stored JSON (derived, not persisted)", () => {
    const doc = createEmptyDocument("derived");
    doc.sections = [
      createSection([ordered("decimal", [li("li_00000001", "one"), li("li_00000002", "two")])]),
    ];
    const json = serializeDocument(doc);
    const back = deserializeDocument(json);
    const list = back.sections[0].blocks[0];
    expect(list.type).toBe("list");
    if (list.type === "list") {
      expect(list).toEqual(doc.sections[0].blocks[0]);
      expect(Object.prototype.hasOwnProperty.call(list.items[0], "number")).toBe(false);
    }
  });
});

/* ------------------------------------------------------- normalization */

describe("legacy bulletList normalization (V1-LIST-003)", () => {
  const legacy = createDocumentFixture();
  legacy.sections[0].blocks = [
    { id: "hd_00000001", type: "heading", level: 1, content: [{ text: "H", marks: [] }], style: null, format: EMPTY_PARAGRAPH_FORMAT },
    {
      id: "bl_00000001",
      type: "bulletList",
      items: [para("pg_00000001", "one"), para("pg_00000002", "two")],
    },
  ];

  it("converts a flat bulletList to canonical list, preserving content/ids", () => {
    const normalized = normalizeLegacyLists(legacy);
    expect(hasLegacyLists(legacy)).toBe(true);
    expect(hasLegacyLists(normalized)).toBe(false);
    const list = normalized.sections[0].blocks[1];
    expect(list).toEqual({
      id: "bl_00000001",
      type: "list",
      listType: "bullet",
      marker: "disc",
      start: 1,
      items: [
        { id: "li_00000001", content: [para("pg_00000001", "one")], children: [] },
        { id: "li_00000002", content: [para("pg_00000002", "two")], children: [] },
      ],
    });
    // The source document is never mutated (pure transformation).
    expect(legacy.sections[0].blocks[1].type).toBe("bulletList");
  });

  it("is deterministic: the same old document yields the same item ids", () => {
    const a = normalizeLegacyLists(legacy);
    const b = normalizeLegacyLists(legacy);
    expect(a).toEqual(b);
  });

  it("returns the same document object when there is nothing to normalize", () => {
    const canonical = normalizeLegacyLists(normalizeLegacyLists(legacy));
    expect(normalizeLegacyLists(canonical)).toBe(canonical);
  });
});

/* ------------------------------------------------------------- numbering */

describe("derived list numbering (V1-LIST-002/004)", () => {
  it("builds hierarchical decimal labels and restarts nested levels", () => {
    const doc = createEmptyDocument();
    doc.sections = [
      createSection([
        ordered("decimal", [
          li("li_00000001", "a", [li("li_00000002", "a.i"), li("li_00000003", "a.ii")]),
          li("li_00000004", "b", [li("li_00000005", "b.i")]),
        ]),
      ]),
    ];
    const { numbering } = resolveDocument(doc);
    expect(numbering.lists["li_00000001"]).toBe("1");
    expect(numbering.lists["li_00000002"]).toBe("1.1");
    expect(numbering.lists["li_00000003"]).toBe("1.2");
    expect(numbering.lists["li_00000004"]).toBe("2");
    expect(numbering.lists["li_00000005"]).toBe("2.1");
  });

  it("renders each of the five numbering styles", () => {
    const cases: Array<[List["listType"], string, string, string]> = [
      ["decimal", "1", "2", "3"],
      ["lower-alpha", "a", "b", "c"],
      ["upper-alpha", "A", "B", "C"],
      ["lower-roman", "i", "ii", "iii"],
      ["upper-roman", "I", "II", "III"],
    ];
    for (const [listType, one, two, three] of cases) {
      const doc = createEmptyDocument();
      doc.sections = [
        createSection([
          ordered(listType, [
            li("li_00000001", "x"),
            li("li_00000002", "y"),
            li("li_00000003", "z"),
          ]),
        ]),
      ];
      const { numbering } = resolveDocument(doc);
      expect([numbering.lists["li_00000001"], numbering.lists["li_00000002"], numbering.lists["li_00000003"]]).toEqual([one, two, three]);
    }
  });

  it("honours a configurable start", () => {
    const doc = createEmptyDocument();
    doc.sections = [
      createSection([ordered("decimal", [li("li_00000001", "x"), li("li_00000002", "y")], 5)]),
    ];
    const { numbering } = resolveDocument(doc);
    expect(numbering.lists["li_00000001"]).toBe("5");
    expect(numbering.lists["li_00000002"]).toBe("6");
  });

  it("renumbers when items are inserted, deleted, or reordered (no stored value)", () => {
    const build = (labels: string[]) =>
      resolveDocument(
        (() => {
          const doc = createEmptyDocument();
          doc.sections = [
            createSection([
              ordered(
                "decimal",
                labels.map((v, i) => li(`li_0000000${i + 1}`, v)),
              ),
            ]),
          ];
          return doc;
        })(),
      ).numbering.lists;

    expect(build(["a", "b"]).li_00000001).toBe("1");
    expect(build(["a", "b"]).li_00000002).toBe("2");
    expect(build(["b"]).li_00000001).toBe("1"); // delete front → renumber
    expect(build(["b"]).li_00000002).toBeUndefined();
    const reordered = build(["z", "y", "x"]);
    expect([reordered.li_00000001, reordered.li_00000002, reordered.li_00000003]).toEqual(["1", "2", "3"]);
  });

  it("is deterministic and never mutates the document", () => {
    const doc = createEmptyDocument();
    doc.sections = [createSection([ordered("decimal", [li("li_00000001", "x")])])];
    const snapshot = JSON.stringify(doc);
    const a = deriveNumbering(doc);
    const b = deriveNumbering(doc);
    expect(b).toEqual(a);
    expect(JSON.stringify(doc)).toBe(snapshot);
  });

  it("derives no labels for bullet lists", () => {
    const doc = createEmptyDocument();
    doc.sections = [createSection([createList({ items: [createListItem([text("x")])] })])];
    const { numbering } = resolveDocument(doc);
    expect(Object.keys(numbering.lists)).toHaveLength(0);
  });

  it("does not disturb heading/table/figure numbering", () => {
    const doc = createEmptyDocument();
    const table = createTable([["x"]]);
    doc.sections = [
      createSection([
        createHeading(1, [text("top")]),
        ordered("decimal", [li("li_00000001", "x")]),
        table,
      ]),
    ];
    const { numbering } = resolveDocument(doc);
    const heading = doc.sections[0].blocks.find((b) => b.type === "heading");
    expect(heading && numbering.headings[heading.id]).toBe("1");
    expect(numbering.tables[table.id]).toBe("Table 1");
  });
});

/* ------------------------------------------------------------- rendering */

describe("list rendering (shared preview/PDF pipeline)", () => {
  it("renders six bullet markers as semantic <ul> with data-marker", () => {
    for (const marker of ["disc", "circle", "square", "dash", "arrow", "check"] as const) {
      const list = createList({
        listType: "bullet",
        marker,
        items: [createListItem([text("one")]), createListItem([text("two")])],
      });
      const { resolved, blocks } = resolvedWith([list]);
      const html = blockHtml(blocks[0], resolved);
      expect(html).toContain('class="doc-list doc-list-bullet"');
      expect(html).toContain(`data-marker="${marker}"`);
      expect(html.match(/<li /g)).toHaveLength(2);
    }
  });

  it("renders numbered lists as <ol> with derived inline labels", () => {
    const list = ordered("decimal", [
      li("li_00000001", "first", [li("li_00000002", "nested")]),
    ]);
    const { resolved, blocks } = resolvedWith([list]);
    const html = blockHtml(blocks[0], resolved);
    expect(html).toContain('class="doc-list doc-list-ordered"');
    expect(html).toContain('data-numbering="decimal"');
    expect(html).toContain('<span class="doc-list-marker">1.</span>');
    expect(html).toContain('<span class="doc-list-marker">1.1.</span>');
    // nested level is a nested <ol>, not flattened
    expect(html.match(/<ol /g)?.length).toBeGreaterThanOrEqual(2);
    expect(html).not.toContain('data-marker');
  });

  it("emits a start attribute only for a non-1 start", () => {
    const { resolved, blocks } = resolvedWith([ordered("decimal", [li("li_00000001", "x")], 1)]);
    expect(blockHtml(blocks[0], resolved)).not.toContain("start=");
    const two = resolvedWith([ordered("decimal", [li("li_00000001", "x")], 3)]);
    expect(blockHtml(two.blocks[0], two.resolved)).toContain('start="3"');
  });

  it("re-validates marker/listType at the render boundary (no injection)", () => {
    const { resolved } = resolvedWith([]);
    const hostile = {
      ...createList({ items: [createListItem([text("x")])] }),
      marker: 'disc"><script>alert(1)</script>',
      listType: 'bullet"><style>*{color:red}</style>',
    } as unknown as List;
    const html = blockHtml(hostile, resolved);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<style>");
    expect(html).toContain('data-marker="disc"');
  });

  it("renders multi-paragraph list items", () => {
    const item: ListItem = {
      id: "li_00000001",
      content: [para("pg_00000001", "first"), para("pg_00000002", "second")],
      children: [],
    };
    const { resolved } = resolvedWith([]);
    const fake: List = { id: "bl_00000001", type: "list", listType: "bullet", marker: "disc", start: 1, items: [item] };
    const html = blockHtml(fake, resolved);
    expect(html.match(/class="doc-list-para/g)).toHaveLength(2);
  });
});

/* --------------------------------------------------------------- envelope */

describe("list JSON round-trip", () => {
  it("survives serialize → deserialize with nested structure intact", () => {
    const doc = createEmptyDocument("round");
    doc.sections = [
      createSection([
        ordered("decimal", [li("li_00000001", "a", [li("li_00000002", "a.i")])], 2),
      ]),
    ];
    const back = deserializeDocument(serializeDocument(doc));
    expect(back).toEqual(doc);
    expect(() => documentSchema.parse(doc)).not.toThrow();
  });
});
