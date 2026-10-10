/**
 * Editor adapter contract (AGENTS.md §24 / Main_Prompt.md): Tiptap JSON ⇄ IR.
 * The adapter is the ONLY place editor state may cross into the IR.
 */
import { describe, expect, it } from "vitest";
import {
  blocksToTiptapDoc,
  tiptapDocToBlocks,
  type TiptapNode,
} from "@/editor/adapter";
import { createDocumentFixture } from "./fixtures";
import type { Block, Paragraph } from "@/core/ir/schema";
import { isNodeId } from "@/core/ir/ids";

function roundTrip(blocks: Block[]): Block[] {
  return tiptapDocToBlocks(blocksToTiptapDoc(blocks));
}

describe("adapter — IR → Tiptap → IR round-trip", () => {
  it("preserves every block, mark, and id of the fixture sections", () => {
    const doc = createDocumentFixture();
    for (const section of doc.sections) {
      const back = roundTrip(section.blocks);
      expect(back).toEqual(section.blocks);
    }
  });

  it("keeps stable ids through repeated round-trips", () => {
    const doc = createDocumentFixture();
    let blocks = doc.sections[0].blocks;
    for (let i = 0; i < 5; i++) blocks = roundTrip(blocks);
    expect(blocks).toEqual(doc.sections[0].blocks);
    for (const block of blocks) expect(isNodeId(block.id)).toBe(true);
  });

  it("preserves heading levels, image attrs, and page breaks", () => {
    const blocks: Block[] = [
      { id: "hd_abcdef12", type: "heading", level: 3, content: [{ text: "Deep", marks: [] }], style: null },
      {
        id: "im_abcdef12",
        type: "image",
        src: "data:image/svg+xml;utf8,PHN2Zy8+",
        alt: "plot",
        widthMm: 80,
        caption: "Figure title",
      },
      { id: "pb_abcdef12", type: "pageBreak" },
      { id: "hr_abcdef12", type: "horizontalRule" },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("preserves marks including links", () => {
    const blocks: Block[] = [
      {
        id: "pg_abcdef12",
        type: "paragraph",
        style: null,
        content: [
          { text: "see ", marks: [] },
          { text: "manual", marks: [{ type: "link", href: "https://example.org/m" }] },
          { text: " now", marks: [{ type: "bold" }, { type: "italic" }] },
          { text: "code", marks: [{ type: "code" }] },
        ],
      },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("maps header rows to tableHeader cells and back", () => {
    const doc = createDocumentFixture();
    const table = doc.sections[0].blocks.find((b) => b.type === "table");
    expect(table?.type).toBe("table");
    const tiptap = blocksToTiptapDoc([table!]);
    const row0 = tiptap.content![0].content![0];
    expect(row0.content!.every((c) => c.type === "tableHeader")).toBe(true);
    expect(roundTrip([table!])).toEqual([table!]);
  });

  it("maps a headerRow:false table to plain cells", () => {
    const blocks: Block[] = [
      {
        id: "tb_abcdef12",
        type: "table",
        caption: null,
        headerRow: false,
        columnWidths: ["60px", "40px"],
        rows: [
          {
            id: "tr_abcdef12",
            type: "tableRow",
            cells: [
              { id: "tc_abcdef12", type: "tableCell", content: [{ id: "pg_abcdef12", type: "paragraph", content: [{ text: "a", marks: [] }], style: null }] },
              { id: "tc_abcdef13", type: "tableCell", content: [{ id: "pg_abcdef13", type: "paragraph", content: [{ text: "b", marks: [] }], style: null }] },
            ],
          },
        ],
      },
    ];
    const tiptap = blocksToTiptapDoc(blocks);
    const cells = tiptap.content![0].content![0].content!;
    expect(cells.every((c) => c.type === "tableCell")).toBe(true);
    // px widths survive through cell colwidth attrs
    expect(cells[0].attrs?.colwidth).toEqual([60]);
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("maps bullet list items to listItems and back (flat)", () => {
    const blocks: Block[] = [
      {
        id: "bl_abcdef12",
        type: "bulletList",
        items: [
          { id: "pg_abcdef12", type: "paragraph", content: [{ text: "one", marks: [] }], style: null },
          { id: "pg_abcdef13", type: "paragraph", content: [{ text: "two", marks: [{ type: "bold" }] }], style: null },
        ],
      },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });
});

describe("adapter — Tiptap → IR defensive mapping", () => {
  it("flattens nested lists depth-first (documented limitation)", () => {
    const nested: TiptapNode = {
      type: "doc",
      content: [
        {
          type: "bulletList",
          attrs: { id: "bl_abcdef12" },
          content: [
            {
              type: "listItem",
              content: [
                { type: "paragraph", attrs: { id: "pg_abcdef12" }, content: [{ type: "text", text: "outer" }] },
                {
                  type: "bulletList",
                  content: [
                    { type: "listItem", content: [{ type: "paragraph", attrs: { id: "pg_abcdef13" }, content: [{ type: "text", text: "inner" }] }] },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const blocks = tiptapDocToBlocks(nested);
    expect(blocks).toHaveLength(1);
    const list = blocks[0];
    expect(list.type).toBe("bulletList");
    if (list.type === "bulletList") {
      expect(list.items.map((i: Paragraph) => i.content[0].text)).toEqual(["outer", "inner"]);
      expect(list.items[0].id).toBe("pg_abcdef12");
    }
  });

  it("generates ids when missing, matching the node's prefix", () => {
    const doc: TiptapNode = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "x" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "y" }] },
        { type: "pageBreak" },
      ],
    };
    const blocks = tiptapDocToBlocks(doc);
    expect(blocks.map((b) => b.id.split("_")[0])).toEqual(["pg", "hd", "pb"]);
    for (const b of blocks) expect(isNodeId(b.id)).toBe(true);
  });

  it("does not invent blocks for an empty doc", () => {
    expect(tiptapDocToBlocks({ type: "doc" })).toEqual([]);
    expect(tiptapDocToBlocks({ type: "paragraph" })).toEqual([]);
  });

  it("round-trips an empty section through the editor's minimum doc", () => {
    // Tiptap docs must contain at least one block: [] becomes one empty
    // paragraph in the editor, which maps back as one empty paragraph.
    expect(roundTrip([])).toEqual([
      { id: expect.any(String), type: "paragraph", content: [], style: null },
    ]);
  });

  it("collapses non-paragraph cell content to its text", () => {
    const doc: TiptapNode = {
      type: "doc",
      content: [
        {
          type: "table",
          attrs: { id: "tb_abcdef12" },
          content: [
            {
              type: "tableRow",
              attrs: { id: "tr_abcdef12" },
              content: [
                {
                  type: "tableHeader",
                  attrs: { id: "tc_abcdef12" },
                  content: [
                    { type: "bulletList", content: [
                      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "odd" }] }] },
                    ] },
                  ],
                },
                { type: "tableHeader", attrs: { id: "tc_abcdef13" }, content: [{ type: "paragraph", content: [{ type: "text", text: "fine" }] }] },
              ],
            },
          ],
        },
      ],
    };
    const blocks = tiptapDocToBlocks(doc);
    expect(blocks).toHaveLength(1);
    if (blocks[0].type === "table") {
      const cells = blocks[0].rows[0].cells;
      expect(cells[0].content).toHaveLength(1);
      expect(cells[0].content[0].content[0].text).toBe("odd");
      expect(blocks[0].headerRow).toBe(true);
    }
  });

  it("drops unknown marks instead of failing the load", () => {
    const doc: TiptapNode = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { id: "pg_abcdef12" },
          content: [
            { type: "text", text: "s", marks: [{ type: "strike" }] },
            { type: "text", text: "b", marks: [{ type: "bold" }] },
          ],
        },
      ],
    };
    const blocks = tiptapDocToBlocks(doc);
    expect(blocks[0]).toEqual({
      id: "pg_abcdef12",
      type: "paragraph",
      style: null,
      content: [
        { text: "s", marks: [] },
        { text: "b", marks: [{ type: "bold" }] },
      ],
    });
  });
});

describe("adapter — style references (V1-STYLE-002)", () => {
  it("carries an explicit style reference through the round-trip", () => {
    const blocks: Block[] = [
      {
        id: "pg_abcdef12",
        type: "paragraph",
        style: "note",
        content: [{ text: "remember", marks: [] }],
      },
      {
        id: "hd_abcdef12",
        type: "heading",
        level: 2,
        style: "heading-2",
        content: [{ text: "Scope", marks: [] }],
      },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("writes the style reference into the Tiptap attrs", () => {
    const blocks: Block[] = [
      { id: "pg_abcdef12", type: "paragraph", style: "warning", content: [] },
      { id: "hd_abcdef12", type: "heading", level: 1, style: "heading-1", content: [] },
    ];
    const doc = blocksToTiptapDoc(blocks);
    expect(doc.content?.[0].attrs).toMatchObject({ id: "pg_abcdef12", style: "warning" });
    expect(doc.content?.[1].attrs).toMatchObject({ id: "hd_abcdef12", level: 1, style: "heading-1" });
  });

  it("drops an invalid/foreign style id instead of failing the load", () => {
    const doc: TiptapNode = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { id: "pg_abcdef12", style: "EVIL;color:red" },
          content: [{ type: "text", text: "x" }],
        },
      ],
    };
    const blocks = tiptapDocToBlocks(doc);
    const first = blocks[0];
    expect(first.type === "paragraph" || first.type === "heading" ? first.style : null).toBeNull();
  });

  it("maps a missing style reference to null (derived built-in at resolve)", () => {
    const doc: TiptapNode = {
      type: "doc",
      content: [{ type: "paragraph", attrs: { id: "pg_abcdef12" }, content: [] }],
    };
    const first = tiptapDocToBlocks(doc)[0];
    expect(first.type === "paragraph" || first.type === "heading" ? first.style : null).toBeNull();
  });
});
