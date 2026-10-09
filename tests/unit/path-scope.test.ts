/**
 * Path-scope guard regression (docs/limitations.md item 4).
 *
 * The capability `fs:scope` in src-tauri/capabilities/default.json declares
 * `$HOME/**`, `$APPDATA/**`, `$APPCONFIG/**`, but on tauri-plugin-fs 2.6.0 it
 * was observed NOT enforced at runtime (2026-10-09 desktop probe: native Save
 * wrote `src-tauri\save\untitled.labdoc.json` and a probe Save As to
 * `C:\Temp\docmaker-probe\…` both succeeded — both outside `$HOME/**`).
 * src/app/path-scope.ts is the application-level enforcement that actually
 * holds; these tests pin its allow/deny behaviour so a regression is caught
 * without a desktop session.
 */
import { describe, expect, it } from "vitest";
import { isPathInScope, normalizeScopePath } from "@/app/path-scope";

// Mirrors the capability variables as resolved on the authoring machine.
const HOME = "C:\\Users\\Ikram";
const APPDATA = "C:\\Users\\Ikram\\AppData\\Roaming\\com.docmaker.desktop";

describe("normalizeScopePath", () => {
  it("normalizes separators, trailing slashes and case", () => {
    expect(normalizeScopePath("C:\\Users\\Ikram\\Documents\\a.json")).toBe(
      "c:/users/ikram/documents/a.json",
    );
    expect(normalizeScopePath("C:\\Users\\Ikram\\")).toBe("c:/users/ikram");
  });

  it("keeps drive and filesystem roots intact", () => {
    expect(normalizeScopePath("C:\\")).toBe("c:/");
    expect(normalizeScopePath("/")).toBe("/");
  });
});

describe("isPathInScope", () => {
  it("allows files under the home root (in-scope saves)", () => {
    expect(isPathInScope("C:\\Users\\Ikram\\Documents\\a.labdoc.json", [HOME])).toBe(true);
    expect(isPathInScope("C:\\Users\\Ikram\\Desktop\\a.labdoc.json", [HOME])).toBe(true);
  });

  it("allows files under the app-data roots", () => {
    expect(
      isPathInScope("C:\\Users\\Ikram\\AppData\\Roaming\\com.docmaker.desktop\\f.json", [
        HOME,
        APPDATA,
      ]),
    ).toBe(true);
  });

  it("rejects out-of-scope paths (the observed 2026-10-09 cases)", () => {
    expect(isPathInScope("C:\\Temp\\docmaker-probe\\probe-outside.labdoc.json", [HOME])).toBe(
      false,
    );
    expect(
      isPathInScope("C:\\Projects\\Doc\\DocMaker\\src-tauri\\save\\untitled.labdoc.json", [HOME]),
    ).toBe(false);
  });

  it("rejects a sibling directory that merely shares a name prefix", () => {
    expect(isPathInScope("C:\\Users\\Ikramish\\x.json", [HOME])).toBe(false);
  });

  it("is case-insensitive (Windows filesystem semantics)", () => {
    expect(isPathInScope("c:\\users\\ikram\\Desktop\\x.json", [HOME])).toBe(true);
    expect(isPathInScope("C:\\USERS\\IKRAM\\Documents\\x.json", [HOME])).toBe(true);
  });
});