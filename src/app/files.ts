/**
 * Local-first file operations: Tauri dialog+fs when running in the desktop
 * shell, browser download/file-input otherwise (dev server, e2e tests).
 * No network, no backend (AGENTS.md §16).
 *
 * Scope: the native path enforces the documented `$HOME`/`$APPDATA`/
 * `$APPCONFIG` boundary at the application layer (path-scope.ts) because the
 * tauri-plugin-fs 2.6.0 capability scope was observed unenforced at runtime
 * (2026-10-09 probe) — see docs/limitations.md item 4.
 */
import { isPathInScope } from "./path-scope";

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
    await assertNativePathInScope(path, "Save");
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
    await assertNativePathInScope(path, "Open");
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

/**
 * Roots the native workflow may touch, mirroring the capability's `$HOME`,
 * `$APPDATA` and `$APPCONFIG` variables one-to-one:
 *   $HOME      -> homeDir()
 *   $APPDATA   -> appDataDir()   (BaseDirectory::AppData)
 *   $APPCONFIG -> appConfigDir() (BaseDirectory::AppConfig)
 * Only used in the Tauri shell, so the dynamic import is safe in browsers.
 */
async function nativeScopeRoots(): Promise<string[]> {
  const { homeDir, appDataDir, appConfigDir } = await import("@tauri-apps/api/path");
  const roots = [await homeDir(), await appDataDir(), await appConfigDir()];
  return [...new Set(roots)];
}

/**
 * Enforces the documented file scope (docs/limitations.md item 4) at the
 * application layer. The capability declares the same roots, but the
 * tauri-plugin-fs 2.6.0 scope was observed NOT enforced at runtime
 * (2026-10-09: Save to `src-tauri\save\…` and a probe Save to `C:\Temp\…`
 * both succeeded), so this guard is the boundary that actually holds.
 * Failures are explicit and actionable (AGENTS.md §33), surfaced by the
 * existing `Save failed — …` / `Open failed — …` status paths.
 */
async function assertNativePathInScope(path: string, action: "Save" | "Open"): Promise<void> {
  const roots = await nativeScopeRoots();
  if (!isPathInScope(path, roots)) {
    throw new Error(
      `${action} blocked — ${path} is outside the allowed folder scope ` +
        `(home and app-data folders: ${roots.join(", ")}). ` +
        "Choose a folder under your user profile.",
    );
  }
}
