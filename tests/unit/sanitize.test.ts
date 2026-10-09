/**
 * Link safety (AGENTS.md §61/§99): document-provided hrefs are untrusted and
 * must never become a script-execution vector in preview, PDF or editor.
 */
import { describe, expect, it } from "vitest";
import { sanitizeHref, isSafeHref } from "@/core/ir/sanitize";
import { renderLayout } from "@/core/layout";
import { resolveDocument } from "@/core/resolve";
import { createEmptyDocument, createParagraph, text } from "@/core/ir/factory";
import { blocksToTiptapDoc, tiptapDocToBlocks } from "@/editor/adapter";
import type { Block } from "@/core/ir/schema";

describe("sanitizeHref", () => {
  it("allows http, https, mailto, tel and relative/anchor URLs", () => {
    for (const href of [
      "https://example.com/a",
      "http://example.com",
      "mailto:lab@example.com",
      "tel:+123456",
      "page.html",
      "/absolute/path",
      "#anchor",
      "docs/../x",
    ]) {
      expect(sanitizeHref(href), href).toBe(href);
      expect(isSafeHref(href), href).toBe(true);
    }
  });

  it("blocks script and data schemes, including obfuscated casing/whitespace", () => {
    for (const href of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      "  javascript:alert(1)  ",
      "java\tscript:alert(1)",
      "java\nscript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:msgbox(1)",
      "file:///etc/passwd",
    ]) {
      expect(sanitizeHref(href), href).toBeNull();
      expect(isSafeHref(href), href).toBe(false);
    }
    expect(sanitizeHref("")).toBeNull();
  });
});

describe("link safety in the layout pipeline", () => {
  it("renders a safe link as a hardened anchor", () => {
    const doc = createEmptyDocument("Links");
    doc.sections[0].blocks = [
      createParagraph([
        text("see ", []),
        { text: "site", marks: [{ type: "link", href: "https://example.com" }] },
      ]),
    ];
    const html = renderLayout(resolveDocument(doc), { pagedJsSrc: "/p.js" });
    expect(html).toContain('<a href="https://example.com" rel="noopener noreferrer">site</a>');
  });

  it("never emits a javascript: link from document content", () => {
    const doc = createEmptyDocument("Bad links");
    doc.sections[0].blocks = [
      createParagraph([
        { text: "click", marks: [{ type: "link", href: "javascript:alert(1)" }] },
      ]),
    ];
    const html = renderLayout(resolveDocument(doc), { pagedJsSrc: "/p.js" });
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<a ");
    expect(html).toContain("click"); // text survives, link is dropped
  });
});

describe("link safety in the editor adapter", () => {
  it("drops unsafe link marks on the way back into the IR", () => {
    const blocks: Block[] = [
      createParagraph([
        { text: "bad", marks: [{ type: "link", href: "javascript:alert(1)" }] },
        { text: "good", marks: [{ type: "link", href: "https://example.com" }] },
      ]),
    ];
    const back = tiptapDocToBlocks(blocksToTiptapDoc(blocks));
    const para = back[0];
    expect(para.type).toBe("paragraph");
    if (para.type === "paragraph") {
      expect(para.content[0].marks).toEqual([]);
      expect(para.content[1].marks).toEqual([
        { type: "link", href: "https://example.com" },
      ]);
    }
  });
});
