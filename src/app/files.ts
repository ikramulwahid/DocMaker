/**
 * Local-first file operations: Tauri dialog+fs when running in the desktop
 * shell, browser download/file-input otherwise (dev server, e2e tests).
 * No network, no backend (AGENTS.md §16).
 */

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export interface OpenedFile {
  json: string;
  name: string;
}

/** Save JSON under `suggestedName`. Returns the chosen name, or null if the
 * user cancelled. In the browser this downloads the file. */
export async function saveJson(suggestedName: string, json: string): Promise<string | null> {
  if (isTauri()) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeTextFile } = await import("@tauri-apps/plugin-fs");
    const path = await save({
      defaultPath: suggestedName,
      filters: [{ name: "DocMaker document", extensions: ["json"] }],
    });
    if (!path) return null;
    await writeTextFile(path, json);
    return path.split(/[\\/]/).pop() ?? path;
  }
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = suggestedName;
  anchor.click();
  URL.revokeObjectURL(url);
  return suggestedName;
}

/** Open a JSON file. Returns null when cancelled. */
export async function openJson(): Promise<OpenedFile | null> {
  if (isTauri()) {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const { readTextFile } = await import("@tauri-apps/plugin-fs");
    const path = await open({
      multiple: false,
      filters: [{ name: "DocMaker document", extensions: ["json"] }],
    });
    if (typeof path !== "string") return null;
    return { json: await readTextFile(path), name: path.split(/[\\/]/).pop() ?? path };
  }
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.style.display = "none";
    input.addEventListener("change", () => {
      const file = input.files?.[0] ?? null;
      input.remove();
      if (!file) {
        resolve(null);
        return;
      }
      file.text().then((json) => resolve({ json, name: file.name }));
    });
    // Cancel is not observable in browsers: resolve stays pending, which is
    // fine — nothing in the app awaits it beyond the button handler.
    document.body.appendChild(input);
    input.click();
  });
}
