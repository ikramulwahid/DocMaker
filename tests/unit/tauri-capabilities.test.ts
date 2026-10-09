/**
 * Phase 0 manual-acceptance regression — Tauri capability grants.
 *
 * The first native-desktop save attempt (2026-10-09) failed at runtime with
 * `fs.write_text_file not allowed. Permissions associated with this command
 * do not allow the operation`: `fs:default` in tauri-plugin-fs 2.6.0 grants
 * only app-directory reads plus webview-data denials — it does NOT enable
 * `read_text_file` / `write_text_file`. The capability must explicitly grant
 * those commands, scoped to the documented roots (docs/limitations.md item 4),
 * or native Open/Save fails even though the dialogs open. These tests pin
 * that configuration so a regression is caught without a desktop session.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

interface FsScopePermission {
  identifier: string;
  allow: { path: string }[];
}

const capabilities = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("../../src-tauri/capabilities/default.json", import.meta.url)),
    "utf8",
  ),
) as { permissions: unknown[] };

const flat = capabilities.permissions.filter((p): p is string => typeof p === "string");

const fsScope = capabilities.permissions.find(
  (p) => typeof p === "object" && p !== null && (p as FsScopePermission).identifier === "fs:scope",
) as FsScopePermission | undefined;

describe("Tauri capability grants (native Open/Save)", () => {
  it("grants the two fs commands the app actually calls", () => {
    // src/app/files.ts: openJson -> readTextFile, saveJson -> writeTextFile.
    expect(flat).toContain("fs:allow-read-text-file");
    expect(flat).toContain("fs:allow-write-text-file");
  });

  it("keeps the documented, narrow fs scope roots", () => {
    expect(fsScope).toBeDefined();
    const paths = (fsScope?.allow ?? []).map((e) => e.path);
    expect(paths).toEqual(["$HOME/**", "$APPDATA/**", "$APPCONFIG/**"]);
  });

  it("retains dialog:default for the native save/open dialogs", () => {
    expect(flat).toContain("dialog:default");
  });
});