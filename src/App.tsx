/**
 * App shell: toolbar + sidebar + editor + live preview.
 * The IR in the store is the only document state; every pane reads/writes it.
 */
import { Preview } from "@/components/Preview";
import { Sidebar } from "@/components/Sidebar";
import { EditorPanel } from "@/editor/EditorPanel";
import { effectivePageSizeMm, serializeDocument, tryDeserializeDocument } from "@/core";
import { collectUnresolvedFields, unresolvedFieldMessages } from "@/core/fields";
import { openJson, saveJson } from "@/app/files";
import { useDocStore } from "@/store";

export default function App() {
  const fileName = useDocStore((s) => s.fileName);
  const dirty = useDocStore((s) => s.dirty);
  const status = useDocStore((s) => s.status);

  const onNew = () => {
    useDocStore.getState().newDocument();
  };

  const onOpen = async () => {
    const file = await openJson();
    if (!file) return;
    const parsed = tryDeserializeDocument(file.json);
    const state = useDocStore.getState();
    if (!parsed.ok) {
      state.setStatus(`Open failed — ${parsed.error.split("\n")[0]}`);
      return;
    }
    state.setDocument(parsed.document, file.name);
  };

  const onSave = async () => {
    const state = useDocStore.getState();
    try {
      const json = serializeDocument(state.document);
      const name = await saveJson(state.fileName, json);
      if (name) state.markSaved(name);
      else state.setStatus("Save cancelled");
    } catch (err) {
      state.setStatus(`Save failed — ${err instanceof Error ? err.message.split("\n")[0] : String(err)}`);
    }
  };

  const onExportPdf = () => {
    const state = useDocStore.getState();
    // V1-FIELD-004: final PDF export is refused while a USED field has no
    // value. Saving the `.labdoc.json` draft stays possible; only the final
    // output is gated. The list is actionable so the user knows what to fix.
    const report = collectUnresolvedFields(state.document);
    if (report.occurrences.length > 0) {
      state.setStatus(
        `PDF export blocked — ${report.occurrences.length} unresolved field(s): ${unresolvedFieldMessages(report).join("; ")}`,
      );
      return;
    }
    // The browser print dialog is a single paper size, so a faithful in-app
    // print is only possible when every sheet has the same geometry.
    const sizes = state.document.sections.map((s) => effectivePageSizeMm(s.pageSetup));
    const mixed = sizes.some(
      (s) => s.widthMm !== sizes[0].widthMm || s.heightMm !== sizes[0].heightMm,
    );
    state.setStatus(
      mixed
        ? "Mixed page sizes/orientations: use `pnpm pdf <file>` for the verified PDF path; the browser print dialog keeps one paper size (see docs/limitations.md)"
        : "Print dialog: choose “Save as PDF”",
    );
    try {
      const frame = document.getElementById("preview-frame") as HTMLIFrameElement | null;
      frame?.contentWindow?.focus();
      frame?.contentWindow?.print();
    } catch {
      state.setStatus("Printing is unavailable in this shell — run `pnpm pdf <file>`");
    }
  };

  return (
    <div className="app">
      <header className="toolbar-top">
        <span className="brand">DocMaker</span>
        <span className="file-name" data-testid="file-name">
          {fileName}
          {dirty ? " •" : ""}
        </span>
        <div className="toolbar-actions">
          <button type="button" onClick={onNew} data-testid="new">
            New
          </button>
          <button type="button" onClick={() => void onOpen()} data-testid="open">
            Open
          </button>
          <button type="button" onClick={() => void onSave()} data-testid="save">
            Save
          </button>
          <button type="button" onClick={onExportPdf} data-testid="export-pdf">
            Export PDF
          </button>
        </div>
        <span className="status" role="status" data-testid="status">
          {status}
        </span>
      </header>
      <main className="workspace">
        <Sidebar />
        <EditorPanel />
        <Preview />
      </main>
    </div>
  );
}
