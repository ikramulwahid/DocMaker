/**
 * Path-scope validation for the native file workflow (docs/limitations.md
 * item 4; capability `fs:scope` in src-tauri/capabilities/default.json).
 *
 * Why this exists: the capability declares an fs scope of `$HOME/**`,
 * `$APPDATA/**`, `$APPCONFIG/**`, but on tauri-plugin-fs 2.6.0 that scope was
 * observed NOT enforced at runtime (2026-10-09 desktop probe): a native Save
 * wrote `C:\Projects\Doc\DocMaker\src-tauri\save\untitled.labdoc.json` (outside
 * `$HOME/**`) and a probe Save As to `C:\Temp\docmaker-probe\…` also succeeded.
 * The documented boundary is therefore enforced here, at the file-I/O layer,
 * deterministically and independently of the plugin/ACL behaviour.
 *
 * Threat model: this guard validates only the paths routed through
 * `saveJson()` / `openJson()` (src/app/files.ts). It is an application-level
 * check, not an OS-level security boundary: it does not (and cannot) stop a
 * caller that invokes the Tauri fs plugin directly or accesses the filesystem
 * behind the app. Paths containing dot-directory components (`.`, `..`) are
 * rejected outright — a lexical prefix check cannot safely interpret `..`
 * (e.g. `C:\Users\Ikram\..\..\Temp\probe.json` resolves to `C:\Temp\probe.json`,
 * outside the root). The OS dialogs return canonical paths, so rejecting dot
 * components never blocks a real user selection.
 *
 * Pure module: no Tauri imports, unit-tested in tests/unit/path-scope.test.ts.
 */

/**
 * Normalize a filesystem path for scope comparison.
 *
 * - Backslashes become forward slashes.
 * - Duplicate separators collapse (UNC-style `//` is flattened; the guard only
 *   deals with drive/user-folder roots, so UNC is deliberately unsupported).
 * - Trailing separators are trimmed (roots like `c:/` stay intact).
 * - The whole string is lower-cased: the native target is Windows, whose
 *   filesystem is case-insensitive end-to-end.
 */
export function normalizeScopePath(p: string): string {
  let s = p.replace(/\\/g, "/");
  s = s.replace(/\/{2,}/g, "/");
  if (s !== "/") {
    s = s.replace(/\/+$/, "");
  }
  s = s.toLowerCase();
  // Restore a drive root's separator: `C:\` normalizes like `c:/`, not `c:`.
  if (/^[a-z]:$/.test(s)) s += "/";
  return s;
}

/**
 * True when `path` is the root itself or a descendant of one of `roots`.
 *
 * Paths containing dot-directory components (`.`, `..`) are always rejected:
 * see the module comment — lexical containment cannot resolve `..` safely, so
 * they are refused before any prefix comparison happens.
 */
export function isPathInScope(path: string, roots: readonly string[]): boolean {
  const p = normalizeScopePath(path);
  if (hasDotDirectoryComponent(p)) return false;
  return roots.some((root) => {
    const r = normalizeScopePath(root);
    // Prefix rule handles bare roots ("/") and trailing-slash roots ("c:/").
    const prefix = r === "/" ? "/" : r.endsWith("/") ? r : r + "/";
    return p === r || p.startsWith(prefix);
  });
}

/** True when any normalized path component is exactly `.` or `..`. */
function hasDotDirectoryComponent(p: string): boolean {
  return p.split("/").some((c) => c === "." || c === "..");
}