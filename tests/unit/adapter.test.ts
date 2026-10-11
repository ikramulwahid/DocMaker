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
import { EMPTY_PARAGRAPH_FORMAT, type Block } from "@/core/ir/schema";
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
      { id: "hd_abcdef12", type: "heading", level: 3, content: [{ text: "Deep", marks: [] }], style: null, format: EMPTY_PARAGRAPH_FORMAT },
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
        format: EMPTY_PARAGRAPH_FORMAT,
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
              { id: "tc_abcdef12", type: "tableCell", content: [{ id: "pg_abcdef12", type: "paragraph", content: [{ text: "a", marks: [] }], style: null, format: EMPTY_PARAGRAPH_FORMAT }] },
              { id: "tc_abcdef13", type: "tableCell", content: [{ id: "pg_abcdef13", type: "paragraph", content: [{ text: "b", marks: [] }], style: null, format: EMPTY_PARAGRAPH_FORMAT }] },
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

  it("normalizes a legacy flat bulletList to canonical `list` (keeps content/marks/ids)", () => {
    const blocks: Block[] = [
      {
        id: "bl_abcdef12",
        type: "bulletList",
        items: [
          { id: "pg_abcdef12", type: "paragraph", content: [{ text: "one", marks: [] }], style: null, format: EMPTY_PARAGRAPH_FORMAT },
          { id: "pg_abcdef13", type: "paragraph", content: [{ text: "two", marks: [{ type: "bold" }] }], style: null, format: EMPTY_PARAGRAPH_FORMAT },
        ],
      },
    ];
    expect(roundTrip(blocks)).toEqual([
      {
        id: "bl_abcdef12",
        type: "list",
        listType: "bullet",
        marker: "disc",
        start: 1,
        items: [
          {
            id: "li_abcdef12",
            content: [
              { id: "pg_abcdef12", type: "paragraph", content: [{ text: "one", marks: [] }], style: null, format: EMPTY_PARAGRAPH_FORMAT },
            ],
            children: [],
          },
          {
            id: "li_abcdef13",
            content: [
              { id: "pg_abcdef13", type: "paragraph", content: [{ text: "two", marks: [{ type: "bold" }] }], style: null, format: EMPTY_PARAGRAPH_FORMAT },
            ],
            children: [],
          },
        ],
      },
    ]);
  });

  it("round-trips a canonical recursive list with nested items (structure preserved)", () => {
    const blocks: Block[] = [
      {
        id: "bl_abcdef12",
        type: "list",
        listType: "decimal",
        marker: null,
        start: 3,
        items: [
          {
            id: "li_aaaaaaaa",
            content: [
              { id: "pg_aaaaaaaa", type: "paragraph", content: [{ text: "outer", marks: [] }], style: null, format: EMPTY_PARAGRAPH_FORMAT },
            ],
            children: [
              {
                id: "li_bbbbbbbb",
                content: [
                  { id: "pg_bbbbbbbb", type: "paragraph", content: [{ text: "inner", marks: [{ type: "italic" }] }], style: null, format: EMPTY_PARAGRAPH_FORMAT },
                ],
                children: [],
              },
            ],
          },
        ],
      },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("round-trips bullet marker and ordered numbering/start attributes", () => {
    const blocks: Block[] = [
      { id: "bl_aaaaaaaa", type: "list", listType: "bullet", marker: "arrow", start: 1, items: [] },
      { id: "bl_bbbbbbbb", type: "list", listType: "upper-roman", marker: null, start: 4, items: [] },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("supports multi-paragraph list items", () => {
    const blocks: Block[] = [
      {
        id: "bl_abcdef12",
        type: "list",
        listType: "bullet",
        marker: "square",
        start: 1,
        items: [
          {
            id: "li_aaaaaaaa",
            content: [
              { id: "pg_aaaaaaaa", type: "paragraph", content: [{ text: "first", marks: [] }], style: null, format: EMPTY_PARAGRAPH_FORMAT },
              { id: "pg_bbbbbbbb", type: "paragraph", content: [{ text: "second", marks: [] }], style: null, format: EMPTY_PARAGRAPH_FORMAT },
            ],
            children: [],
          },
        ],
      },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });
});

describe("adapter — Tiptap → IR defensive mapping", () => {
  it("preserves nested list structure instead of flattening it (M3)", () => {
    const nested: TiptapNode = {
      type: "doc",
      content: [
        {
          type: "bulletList",
          attrs: { id: "bl_abcdef12", marker: "circle" },
          content: [
            {
              type: "listItem",
              attrs: { id: "li_abcdef12" },
              content: [
                { type: "paragraph", attrs: { id: "pg_abcdef12" }, content: [{ type: "text", text: "outer" }] },
                {
                  type: "bulletList",
                  content: [
                    { type: "listItem", attrs: { id: "li_abcdef13" }, content: [{ type: "paragraph", attrs: { id: "pg_abcdef13" }, content: [{ type: "text", text: "inner" }] }] },
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
    expect(blocks[0]).toEqual({
      id: "bl_abcdef12",
      type: "list",
      listType: "bullet",
      marker: "circle",
      start: 1,
      items: [
        {
          id: "li_abcdef12",
          content: [
            { id: "pg_abcdef12", type: "paragraph", content: [{ text: "outer", marks: [] }], style: null, format: EMPTY_PARAGRAPH_FORMAT },
          ],
          children: [
            {
              id: "li_abcdef13",
              content: [
                { id: "pg_abcdef13", type: "paragraph", content: [{ text: "inner", marks: [] }], style: null, format: EMPTY_PARAGRAPH_FORMAT },
              ],
              children: [],
            },
          ],
        },
      ],
    });
  });

  it("normalizes a mixed-type nested list to the outer list type (uniform model)", () => {
    const mixed: TiptapNode = {
      type: "doc",
      content: [
        {
          type: "orderedList",
          attrs: { id: "bl_abcdef12", numbering: "decimal" },
          content: [
            {
              type: "listItem",
              attrs: { id: "li_abcdef12" },
              content: [
                { type: "paragraph", attrs: { id: "pg_abcdef12" }, content: [{ type: "text", text: "outer" }] },
                {
                  type: "bulletList",
                  content: [
                    { type: "listItem", attrs: { id: "li_abcdef13" }, content: [{ type: "paragraph", attrs: { id: "pg_abcdef13" }, content: [{ type: "text", text: "inner" }] }] },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const list = tiptapDocToBlocks(mixed)[0];
    expect(list.type).toBe("list");
    if (list.type === "list") {
      expect(list.listType).toBe("decimal");
      expect(list.items[0].children).toHaveLength(1);
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
      { id: expect.any(String), type: "paragraph", content: [], style: null, format: EMPTY_PARAGRAPH_FORMAT },
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
            // `blink` is genuinely unknown — strike IS supported since M2.
            { type: "text", text: "s", marks: [{ type: "blink" }] },
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
      format: EMPTY_PARAGRAPH_FORMAT,
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
        format: EMPTY_PARAGRAPH_FORMAT,
        content: [{ text: "remember", marks: [] }],
      },
      {
        id: "hd_abcdef12",
        type: "heading",
        level: 2,
        style: "heading-2",
        format: EMPTY_PARAGRAPH_FORMAT,
        content: [{ text: "Scope", marks: [] }],
      },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("writes the style reference into the Tiptap attrs", () => {
    const blocks: Block[] = [
      { id: "pg_abcdef12", type: "paragraph", style: "warning", content: [], format: EMPTY_PARAGRAPH_FORMAT },
      { id: "hd_abcdef12", type: "heading", level: 1, style: "heading-1", content: [], format: EMPTY_PARAGRAPH_FORMAT },
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
