/**
 * Tiptap editing pane. The editor NEVER owns document state: every update is
 * pushed through the explicit adapter into the store's IR, and section
 * switches / document loads flow back in through setContent.
 */
import { useEffect, useReducer, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import { createExtensions } from "./extensions";
import { blocksToTiptapDoc, tiptapDocToBlocks } from "./adapter";
import { sanitizeHref, sanitizeImageSrc, LIST_START_MAX } from "@/core/ir/sanitize";
import {
  EMPTY_PARAGRAPH_FORMAT,
  paragraphFormatOverrideSchema,
  type ParagraphFormatOverride,
} from "@/core/ir/schema";
import { fieldDefinitionsBySource } from "@/core/fields";
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
    disabled = false,
  ) => (
    <button
      type="button"
      className={active ? "tool active" : "tool"}
      title={title}
      disabled={disabled}
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

  /* ---------------------------------------------- M2 formatting controls */

  // Re-render the toolbar when the caret moves OR the document changes so mark
  // active states, the current paragraph-format values, and the derived list
  // state stay truthful (a list toggle can leave the selection unchanged, so
  // selectionUpdate alone is not enough).
  const [, bump] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    if (!editor) return;
    const onSync = () => bump();
    editor.on("selectionUpdate", onSync);
    editor.on("focus", onSync);
    editor.on("update", onSync);
    return () => {
      editor.off("selectionUpdate", onSync);
      editor.off("focus", onSync);
      editor.off("update", onSync);
    };
  }, [editor]);

  /** The block the caret is in ("heading" | "paragraph" = the override target). */
  const blockTarget = () =>
    editor.isActive("heading") ? ("heading" as const) : ("paragraph" as const);

  /** Current paragraph-format overrides of the caret block (empty = inherit). */
  const blockFormat = (): ParagraphFormatOverride => {
    const raw = editor.getAttributes(blockTarget()).format as
      | ParagraphFormatOverride
      | undefined;
    return raw ?? EMPTY_PARAGRAPH_FORMAT;
  };

  /**
   * Patch the caret block's paragraph overrides. The merged value is validated
   * against the IR schema BEFORE it enters the store; invalid input fails with
   * an explicit status message and is never applied (AGENTS.md §33).
   * `null` clears an override back to inherit.
   */
  const patchParagraphFormat = (patch: Partial<ParagraphFormatOverride>) => {
    const merged = { ...blockFormat(), ...patch };
    const parsed = paragraphFormatOverrideSchema.safeParse(merged);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const where = issue?.path.join(".") || "format";
      useDocStore
        .getState()
        .setStatus(`Paragraph format rejected — ${where}: ${issue?.message ?? "invalid value"}`);
      return;
    }
    editor.chain().focus().updateAttributes(blockTarget(), { format: parsed.data }).run();
  };

  /** Character-side select helpers (marks apply to the selection). */
  const markValue = <T,>(name: string, attr: string): T | undefined =>
    editor.getAttributes(name)[attr] as T | undefined;

  /* ---------------------------------------------- M3 list controls */

  // The IR list model is uniform: one `listType`/`marker` owns the whole tree,
  // and the canonical block is the OUTERMOST list. Resolve it from the whole
  // selection range (not just the caret) so it is correct for collapsed
  // selections, text selections, and whole-document (AllSelection) ranges — a
  // list toggle straight after Ctrl+A leaves an AllSelection whose `$from`
  // sits at the document boundary.
  const outerLists: { pos: number; attrs: Record<string, unknown>; name: string }[] = [];
  editor.state.doc.nodesBetween(editor.state.selection.from, editor.state.selection.to, (node, pos) => {
    if (outerLists.length) return false;
    if (node.type.name === "bulletList" || node.type.name === "orderedList") {
      outerLists.push({ pos, attrs: node.attrs, name: node.type.name });
      return false; // do not descend into the list
    }
    return true;
  });
  const outerList = outerLists[0] ?? null;
  const inBullet = outerList?.name === "bulletList";
  const inOrdered = outerList?.name === "orderedList";
  const inList = inBullet || inOrdered;
  const bulletMarker = (outerList?.attrs.marker as string | undefined) ?? "disc";
  const numbering = (outerList?.attrs.numbering as string | undefined) ?? "decimal";
  const listStart =
    typeof outerList?.attrs.start === "number" ? (outerList.attrs.start as number) : 1;

  /** Re-mark the outermost list with new presentation attributes. Values are
   * enum options from the same allow-lists as the IR, so the UI can never emit
   * an invalid value; the adapter and schema still re-validate downstream. */
  const setListAttrs = (attrs: Record<string, unknown>) => {
    const targets: { pos: number; attrs: Record<string, unknown> }[] = [];
    editor.state.doc.nodesBetween(editor.state.selection.from, editor.state.selection.to, (node, pos) => {
      if (targets.length) return false;
      if (node.type.name === "bulletList" || node.type.name === "orderedList") {
        targets.push({ pos, attrs: node.attrs });
        return false;
      }
      return true;
    });
    const target = targets[0];
    if (!target) return;
    editor.view.dispatch(
      editor.state.tr.setNodeMarkup(target.pos, undefined, { ...target.attrs, ...attrs }),
    );
    editor.view.focus();
    bump();
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
      <span className="toolbar-sep" aria-hidden="true" />
      {/* Character formatting (V1-FMT-001 — M2) */}
      {button(
        "U",
        () => editor.chain().focus().toggleMark("underline").run(),
        editor.isActive("underline"),
        "Underline",
      )}
      {button(
        "S",
        () => editor.chain().focus().toggleMark("strike").run(),
        editor.isActive("strike"),
        "Strikethrough",
      )}
      {button(
        "x²",
        () => editor.chain().focus().toggleMark("superscript").run(),
        editor.isActive("superscript"),
        "Superscript",
      )}
      {button(
        "x₂",
        () => editor.chain().focus().toggleMark("subscript").run(),
        editor.isActive("subscript"),
        "Subscript",
      )}
      <label className="toolbar-field">
        <span className="toolbar-label">Font</span>
        <select
          data-testid="fmt-font-family"
          aria-label="Font family"
          value={markValue<string>("fontFamily", "fontFamily") ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "") editor.chain().focus().unsetMark("fontFamily").run();
            else editor.chain().focus().setMark("fontFamily", { fontFamily: v }).run();
          }}
        >
          <option value="">Default</option>
          <option value="serif">Serif</option>
          <option value="sans">Sans</option>
          <option value="mono">Mono</option>
        </select>
      </label>
      <label className="toolbar-field">
        <span className="toolbar-label">Size</span>
        <input
          data-testid="fmt-font-size"
          type="number"
          min="6"
          max="72"
          step="0.5"
          aria-label="Font size (pt, 6–72)"
          placeholder="inherit"
          defaultValue={markValue<number>("fontSize", "fontSizePt") ?? ""}
          onBlur={(e) => commitFontSize(editor, e.currentTarget)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitFontSize(editor, e.currentTarget);
          }}
        />
      </label>
      <label className="toolbar-field" data-testid="fmt-color-field">
        <span className="toolbar-label">Colour</span>
        <input
          data-testid="fmt-color"
          type="color"
          aria-label="Text colour"
          value={markValue<string>("color", "color") ?? "#000000"}
          onChange={(e) => editor.chain().focus().setMark("color", { color: e.target.value }).run()}
        />
      </label>
      <label className="toolbar-field" data-testid="fmt-highlight-field">
        <span className="toolbar-label">Highlight</span>
        <input
          data-testid="fmt-highlight"
          type="color"
          aria-label="Highlight colour"
          value={markValue<string>("highlight", "color") ?? "#ffff00"}
          onChange={(e) => editor.chain().focus().setMark("highlight", { color: e.target.value }).run()}
        />
      </label>
      <label className="toolbar-field">
        <span className="toolbar-label">Case</span>
        <select
          data-testid="fmt-text-case"
          aria-label="Text case"
          value={markValue<string>("textCase", "transform") ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "") editor.chain().focus().unsetMark("textCase").run();
            else editor.chain().focus().setMark("textCase", { transform: v }).run();
          }}
        >
          <option value="">Default</option>
          <option value="uppercase">UPPERCASE</option>
          <option value="lowercase">lowercase</option>
        </select>
      </label>
      <span className="toolbar-sep" aria-hidden="true" />
      {/* Paragraph formatting overrides (V1-FMT-002 — M2) */}
      <label className="toolbar-field">
        <span className="toolbar-label">Align</span>
        <select
          data-testid="fmt-align"
          aria-label="Paragraph alignment"
          value={blockFormat().alignment ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            patchParagraphFormat({ alignment: v === "" ? null : (v as ParagraphFormatOverride["alignment"]) });
          }}
        >
          <option value="">Inherit</option>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
          <option value="justify">Justify</option>
        </select>
      </label>
      <OverrideNumberInput
        testId="fmt-line-spacing"
        label="Line spacing"
        hint="Line spacing (0.8–4)"
        min={0.8}
        max={4}
        step={0.05}
        placeholder="inherit"
        value={blockFormat().lineSpacing ?? null}
        onCommit={(n) => patchParagraphFormat({ lineSpacing: n })}
      />
      <OverrideNumberInput
        testId="fmt-space-before"
        label="Space before"
        hint="Space before (mm, 0–50)"
        min={0}
        max={50}
        step={0.5}
        placeholder="inherit"
        value={blockFormat().spaceBeforeMm ?? null}
        onCommit={(n) => patchParagraphFormat({ spaceBeforeMm: n })}
      />
      <OverrideNumberInput
        testId="fmt-space-after"
        label="Space after"
        hint="Space after (mm, 0–50)"
        min={0}
        max={50}
        step={0.5}
        placeholder="inherit"
        value={blockFormat().spaceAfterMm ?? null}
        onCommit={(n) => patchParagraphFormat({ spaceAfterMm: n })}
      />
      <OverrideNumberInput
        testId="fmt-indent-left"
        label="Indent"
        hint="Left indent (mm, 0–80)"
        min={0}
        max={80}
        step={1}
        placeholder="inherit"
        value={blockFormat().indentLeftMm ?? null}
        onCommit={(n) => patchParagraphFormat({ indentLeftMm: n })}
      />
      {button(
        "Clear ¶",
        () =>
          editor
            .chain()
            .focus()
            .updateAttributes(blockTarget(), { format: { alignment: null, lineSpacing: null, spaceBeforeMm: null, spaceAfterMm: null, indentLeftMm: null } })
            .run(),
        false,
        "Clear paragraph overrides (inherit the assigned style)",
      )}
      <span className="toolbar-sep" aria-hidden="true" />
      {/* Lists & multilevel numbering (V1-LIST-001/002 — M3) */}
      {button(
        "• list",
        () => editor.chain().focus().toggleBulletList().run(),
        inBullet,
        "Bullet list",
      )}
      {button(
        "1. list",
        () => editor.chain().focus().toggleOrderedList().run(),
        inOrdered,
        "Numbered list",
      )}
      {button(
        "→|",
        () => editor.chain().focus().sinkListItem("listItem").run(),
        false,
        "Indent (nest) list item",
        !inList,
      )}
      {button(
        "|←",
        () => editor.chain().focus().liftListItem("listItem").run(),
        false,
        "Outdent (unnest) list item",
        !inList,
      )}
      <label className="toolbar-field">
        <span className="toolbar-label">Bullet</span>
        <select
          data-testid="fmt-bullet-marker"
          aria-label="Bullet marker"
          disabled={!inBullet}
          value={bulletMarker}
          onChange={(e) => setListAttrs({ marker: e.target.value })}
        >
          <option value="disc">• Disc</option>
          <option value="circle">◦ Circle</option>
          <option value="square">▪ Square</option>
          <option value="dash">– Dash</option>
          <option value="arrow">→ Arrow</option>
          <option value="check">✓ Check</option>
        </select>
      </label>
      <label className="toolbar-field">
        <span className="toolbar-label">Number</span>
        <select
          data-testid="fmt-ordered-numbering"
          aria-label="Numbering style"
          disabled={!inOrdered}
          value={numbering}
          onChange={(e) => setListAttrs({ numbering: e.target.value })}
        >
          <option value="decimal">1, 2, 3</option>
          <option value="lower-alpha">a, b, c</option>
          <option value="upper-alpha">A, B, C</option>
          <option value="lower-roman">i, ii, iii</option>
          <option value="upper-roman">I, II, III</option>
        </select>
      </label>
      <OverrideNumberInput
        testId="fmt-list-start"
        label="Start"
        hint={`List start (1–${LIST_START_MAX})`}
        min={1}
        max={LIST_START_MAX}
        step={1}
        placeholder="1"
        disabled={!inOrdered}
        value={inOrdered ? listStart : null}
        onCommit={(n) => setListAttrs({ start: n })}
      />
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
      <label className="toolbar-field">
        <span className="toolbar-label">Field</span>
        <select
          data-testid="insert-field"
          aria-label="Insert dynamic field"
          defaultValue=""
          onChange={(e) => {
            const select = e.currentTarget;
            const key = select.value;
            if (!key) return;
            editor
              .chain()
              .focus()
              .insertContent({ type: "fieldRef", attrs: { field: key } })
              .run();
            // Reset the picker to the placeholder AFTER this event so the same
            // field can be inserted again; deferred so the reset never races
            // the change (an uncontrolled select is never re-rendered away
            // from the value the user just chose).
            window.setTimeout(() => {
              select.value = "";
            }, 0);
          }}
        >
          <option value="">Insert field…</option>
          <optgroup label="Document">
            {fieldDefinitionsBySource("document").map((def) => (
              <option key={def.key} value={def.key}>
                {def.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Laboratory">
            {fieldDefinitionsBySource("laboratory").map((def) => (
              <option key={def.key} value={def.key}>
                {def.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Page">
            {fieldDefinitionsBySource("page").map((def) => (
              <option key={def.key} value={def.key}>
                {def.label}
              </option>
            ))}
          </optgroup>
        </select>
      </label>
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

/**
 * Apply a font-size mark from the toolbar number input. Bounded allow-list
 * (6–72 pt, shared with the schema and the render boundary): an out-of-range
 * value is reported through the status bar and never applied. An EMPTY field
 * means inherit → the mark is removed.
 */
function commitFontSize(editor: Editor, input: HTMLInputElement) {
  const text = input.value.trim();
  if (text === "") {
    editor.chain().focus().unsetMark("fontSize").run();
    return;
  }
  const value = Number(text);
  if (typeof value !== "number" || !Number.isFinite(value)) {
    useDocStore.getState().setStatus("Font size must be a number between 6 and 72 pt");
    return;
  }
  if (value < 6 || value > 72) {
    useDocStore.getState().setStatus("Font size must be between 6 and 72 pt");
    return;
  }
  editor.chain().focus().setMark("fontSize", { fontSizePt: value }).run();
}

/**
 * Number input for one paragraph-format override (V1-FMT-002). Shows the
 * current override (placeholder "inherit" when null), commits on blur/Enter
 * and never stores an invalid value: out-of-range input surfaces an
 * actionable status message instead (the schema re-checks at the store edge).
 */
function OverrideNumberInput({
  testId,
  label,
  hint,
  min,
  max,
  step,
  placeholder,
  value,
  onCommit,
  disabled = false,
}: {
  testId: string;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  placeholder: string;
  value: number | null;
  onCommit: (value: number) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    const text = draft;
    setDraft(null);
    if (text === null) return; // nothing typed since last render
    if (text.trim() === "") {
      return; // empty = inherit; the schema value stays null
    }
    const n = Number(text);
    if (typeof n !== "number" || !Number.isFinite(n) || n < min || n > max) {
      useDocStore
        .getState()
        .setStatus(`${hint} — value must be a number between ${min} and ${max}`);
      return;
    }
    onCommit(n);
  };
  return (
    <label className="toolbar-field">
      <span className="toolbar-label">{label}</span>
      <input
        data-testid={testId}
        type="number"
        min={min}
        max={max}
        step={step}
        aria-label={hint}
        placeholder={placeholder}
        value={draft ?? value ?? ""}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
      />
    </label>
  );
}
