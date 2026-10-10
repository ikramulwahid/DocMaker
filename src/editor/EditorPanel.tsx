/**
 * Tiptap editing pane. The editor NEVER owns document state: every update is
 * pushed through the explicit adapter into the store's IR, and section
 * switches / document loads flow back in through setContent.
 */
import { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { createExtensions } from "./extensions";
import { blocksToTiptapDoc, tiptapDocToBlocks } from "./adapter";
import { sanitizeHref, sanitizeImageSrc } from "@/core/ir/sanitize";
import { useDocStore } from "@/store";

export function EditorPanel() {
  const activeSection = useDocStore((s) => s.activeSection);
  const revision = useDocStore((s) => s.revision);

  const editor = useEditor({
    extensions: createExtensions(),
    content: blocksToTiptapDoc(
      useDocStore.getState().document.sections[
        useDocStore.getState().activeSection
      ].blocks,
    ),
    editorProps: {
      attributes: { class: "editor-content", "data-testid": "editor" },
    },
  });

  // Editor → IR (write-through, no debounce: the IR must never lag the view).
  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => {
      const state = useDocStore.getState();
      state.setSectionBlocks(
        state.activeSection,
        tiptapDocToBlocks(editor.getJSON()),
      );
    };
    editor.on("update", onUpdate);
    return () => {
      editor.off("update", onUpdate);
    };
  }, [editor]);

  // IR → Editor, only on section switch or whole-document replacement.
  // useLayoutEffect guarantees this runs before any pending timers, so an
  // update can never be written to the wrong section.
  const prevSection = useRef(activeSection);
  const prevRevision = useRef(revision);
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (prevSection.current === activeSection && prevRevision.current === revision) {
      return;
    }
    prevSection.current = activeSection;
    prevRevision.current = revision;
    const { document } = useDocStore.getState();
    const section = document.sections[activeSection];
    if (section) {
      editor.commands.setContent(blocksToTiptapDoc(section.blocks), false);
    }
  }, [editor, activeSection, revision]);

  if (!editor) return null;
  return (
    <div className="editor-pane">
      <Toolbar editor={editor} />
      <div className="editor-scroll">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
  const activeSection = useDocStore((s) => s.activeSection);
  const stylesMap = useDocStore((s) => s.document.styles);
  const addImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result);
        // Images are untrusted embedded data URIs: reject anything outside the
        // documented allow-list up front so an unrenderable/unsupported source
        // never enters the IR (schema would reject it on save, but failing
        // here gives the user an immediate, actionable message).
        if (sanitizeImageSrc(src) === null) {
          const contentType = file.type || "unknown";
          useDocStore
            .getState()
            .setStatus(
              `Image not added: unsupported image type (${contentType}) — allowed: png, jpeg, gif, webp, bmp, svg (embedded data URI, max 10 MiB)`,
            );
          return;
        }
        editor
          .chain()
          .focus()
          .insertContent({
            type: "image",
            attrs: { src, alt: file.name },
          })
          .run();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };
  const link = () => {
    const href = window.prompt("Link URL (empty removes the link)");
    if (href === null) return;
    if (href === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    // Document links are untrusted data: refuse unsafe schemes up front.
    const safe = sanitizeHref(href);
    if (safe === null) {
      useDocStore.getState().setStatus("Link blocked: only http, https, mailto, tel or relative URLs are allowed");
      return;
    }
    editor.chain().focus().setLink({ href: safe }).run();
  };
  const addEquation = () => {
    const latex = window.prompt(
      "Equation (LaTeX), e.g. x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
    );
    if (latex === null) return;
    const trimmed = latex.trim();
    if (trimmed === "") return;
    editor
      .chain()
      .focus()
      .insertContent({ type: "equation", attrs: { latex: trimmed, display: true } })
      .run();
  };
  const button = (
    label: string,
    onClick: () => void,
    active = false,
    title = label,
  ) => (
    <button
      type="button"
      className={active ? "tool active" : "tool"}
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {label}
    </button>
  );

  // Reusable style assignment (V1-STYLE-002). The effective style is the
  // block's explicit reference, else the derived built-in default
  // (paragraph → normal, heading N → heading-N) — the same rule the
  // resolver uses, so the toolbar and the preview always agree.
  const isHeading = editor.isActive("heading");
  const styleList = Object.values(stylesMap)
    .filter((s) => (isHeading ? s.kind === "heading" : s.kind !== "heading"))
    .sort((a, b) => a.name.localeCompare(b.name));
  const activeStyleId = (() => {
    if (isHeading) {
      const explicit = editor.getAttributes("heading").style;
      if (typeof explicit === "string" && explicit) return explicit;
      return `heading-${String(editor.getAttributes("heading").level ?? 1)}`;
    }
    const explicit = editor.getAttributes("paragraph").style;
    return typeof explicit === "string" && explicit ? explicit : "normal";
  })();
  const applyStyle = (id: string) => {
    const target = isHeading ? "heading" : "paragraph";
    editor.chain().focus().updateAttributes(target, { style: id }).run();
  };

  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting">
      <select
        aria-label="Block type"
        value={
          editor.isActive("heading")
            ? String(editor.getAttributes("heading").level ?? 1)
            : "p"
        }
        onChange={(e) => {
          const v = e.target.value;
          if (v === "p") editor.chain().focus().setParagraph().run();
          else
            editor
              .chain()
              .focus()
              .setHeading({ level: Number(v) as 1 | 2 | 3 | 4 | 5 | 6 })
              .run();
        }}
      >
        <option value="p">Paragraph</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
        <option value="4">Heading 4</option>
        <option value="5">Heading 5</option>
        <option value="6">Heading 6</option>
      </select>
      <select
        aria-label="Style"
        data-testid="style-select"
        value={styleList.some((s) => s.id === activeStyleId) ? activeStyleId : ""}
        onChange={(e) => applyStyle(e.target.value)}
      >
        {styleList.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      {button("B", () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"), "Bold")}
      {button(
        "I",
        () => editor.chain().focus().toggleItalic().run(),
        editor.isActive("italic"),
        "Italic",
      )}
      {button(
        "</>",
        () => editor.chain().focus().toggleCode().run(),
        editor.isActive("code"),
        "Inline code",
      )}
      {button("🔗", link, editor.isActive("link"), "Link")}
      {button(
        "• list",
        () => editor.chain().focus().toggleBulletList().run(),
        editor.isActive("bulletList"),
        "Bullet list",
      )}
      {button(
        "table",
        () =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run(),
        false,
        "Insert table",
      )}
      {button("img", addImage, false, "Insert image (local file)")}
      {button("∑ eq", addEquation, false, "Insert equation (LaTeX)")}
      {button(
        "⎘ break",
        () => editor.chain().focus().insertContent({ type: "pageBreak" }).run(),
        false,
        "Page break",
      )}
      <span className="toolbar-section">Section {activeSection + 1}</span>
    </div>
  );
}
