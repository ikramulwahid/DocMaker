/**
 * M4 page geometry + new-document defaults (V1-PAGE-001..004, V1-PAG-004,
 * V1-PDF-002 non-A4 leg, V1-DOC-002 configurability leg).
 *
 * The geometry table is the single source of truth shared by the schema, the
 * layout CSS, the PDF exporter and the UI. These tests pin the effective size
 * for every format × orientation (orientation applied exactly once; custom
 * never swapped) plus the bounds/usable-area contract and the preference
 * persistence contract (including every corrupt-input fallback).
 */
import { describe, expect, it } from "vitest";
import {
  CUSTOM_PAGE_FORMAT,
  PAGE_SIZE_MM_MAX,
  PAGE_SIZE_MM_MIN,
  PAPER_SIZES_MM,
  STANDARD_PAGE_FORMATS,
  basePageSizeMm,
  customSizeProblem,
  effectivePageSizeCssMm,
  effectivePageSizeMm,
  formatMm,
  isPageSizeMm,
  pageAreaProblem,
  pageFormatLabel,
  pageFormatPatch,
  safePageSizeMm,
  type PageSizeInput,
} from "@/core";
import { createEmptyDocument, createSection } from "@/core/ir/factory";
import { pageSetupSchema, sectionSchema } from "@/core/ir/schema";
import {
  PREFERENCES_STORAGE_KEY,
  applyNewDocumentDefaults,
  defaultPreferences,
  loadPreferences,
  normalizePreferences,
  resetStoredPreferences,
  savePreferences,
  safeThemeId,
  type StorageLike,
} from "@/app/preferences";

function setup(patch: Partial<PageSizeInput> = {}): PageSizeInput {
  return {
    format: "A4",
    orientation: "portrait",
    widthMm: null,
    heightMm: null,
    ...patch,
  };
}

function memoryStorage(initial?: Record<string, string>) {
  const map = new Map(Object.entries(initial ?? {}));
  const storage: StorageLike = {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
  return { storage, map };
}

describe("page geometry table", () => {
  it("defines every standard format plus custom", () => {
    expect(STANDARD_PAGE_FORMATS).toHaveLength(7);
    for (const format of STANDARD_PAGE_FORMATS) {
      const size = PAPER_SIZES_MM[format];
      expect(size.widthMm).toBeGreaterThan(0);
      expect(size.heightMm).toBeGreaterThan(size.widthMm); // stored portrait
    }
  });

  it("applies orientation exactly once to standard formats", () => {
    const expected: Record<string, { p: [number, number]; l: [number, number] }> = {
      A4: { p: [210, 297], l: [297, 210] },
      A3: { p: [297, 420], l: [420, 297] },
      A5: { p: [148, 210], l: [210, 148] },
      Letter: { p: [215.9, 279.4], l: [279.4, 215.9] },
      Legal: { p: [215.9, 355.6], l: [355.6, 215.9] },
      Tabloid: { p: [279.4, 431.8], l: [431.8, 279.4] },
      Executive: { p: [184.15, 266.7], l: [266.7, 184.15] },
    };
    for (const [format, dims] of Object.entries(expected)) {
      const portrait = effectivePageSizeMm(
        setup({ format: format as PageSizeInput["format"], orientation: "portrait" }),
      );
      expect([portrait.widthMm, portrait.heightMm]).toEqual(dims.p);
      const landscape = effectivePageSizeMm(
        setup({ format: format as PageSizeInput["format"], orientation: "landscape" }),
      );
      expect([landscape.widthMm, landscape.heightMm]).toEqual(dims.l);
    }
  });

  it("returns the authored pair for Custom and never swaps it", () => {
    const custom = setup({
      format: CUSTOM_PAGE_FORMAT,
      widthMm: 200,
      heightMm: 150,
      orientation: "portrait",
    });
    expect(effectivePageSizeMm(custom)).toEqual({ widthMm: 200, heightMm: 150 });
    // Landscape is a deliberate no-op for a custom size: both dimensions are
    // already fixed, so a swap here would double-swap the author's intent.
    expect(effectivePageSizeMm({ ...custom, orientation: "landscape" })).toEqual({
      widthMm: 200,
      heightMm: 150,
    });
  });

  it("falls back to A4 (deterministically) for invalid custom or unknown input", () => {
    // Custom missing dimensions → A4 fallback, and orientation still applies
    // to the fallback (it is no longer a custom geometry).
    expect(
      effectivePageSizeMm(setup({ format: CUSTOM_PAGE_FORMAT, widthMm: null, heightMm: null })),
    ).toEqual({ widthMm: 210, heightMm: 297 });
    expect(
      effectivePageSizeMm(
        setup({ format: CUSTOM_PAGE_FORMAT, orientation: "landscape", widthMm: null, heightMm: null }),
      ),
    ).toEqual({ widthMm: 297, heightMm: 210 });
    // A value that bypassed the schema still renders a real sheet.
    const unknown = setup({ format: "Nope" as PageSizeInput["format"] });
    expect(effectivePageSizeMm(unknown)).toEqual({ widthMm: 210, heightMm: 297 });
  });

  it("base size is the intrinsic portrait entry (no orientation)", () => {
    expect(basePageSizeMm(setup({ orientation: "landscape" }))).toEqual({
      widthMm: 210,
      heightMm: 297,
    });
  });

  it("emits trimmed CSS millimetre units (no float artefacts)", () => {
    expect(effectivePageSizeCssMm(setup())).toEqual({ width: "210mm", height: "297mm" });
    expect(effectivePageSizeCssMm(setup({ format: "Letter" }))).toEqual({
      width: "215.9mm",
      height: "279.4mm",
    });
    expect(formatMm(0.1 + 0.2)).toBe("0.3mm");
    expect(formatMm(215.90000000000003)).toBe("215.9mm");
  });

  it("labels standard formats with their dimensions", () => {
    expect(pageFormatLabel("A4")).toContain("210");
    expect(pageFormatLabel("A4")).toContain("297");
    expect(pageFormatLabel(CUSTOM_PAGE_FORMAT)).toBe("Custom");
  });
});

describe("page size bounds (render boundary)", () => {
  it("accepts only finite dimensions inside the documented range", () => {
    expect(isPageSizeMm(PAGE_SIZE_MM_MIN)).toBe(true);
    expect(isPageSizeMm(PAGE_SIZE_MM_MAX)).toBe(true);
    expect(isPageSizeMm(PAGE_SIZE_MM_MIN - 0.01)).toBe(false);
    expect(isPageSizeMm(PAGE_SIZE_MM_MAX + 0.01)).toBe(false);
    expect(isPageSizeMm(Number.NaN)).toBe(false);
    expect(isPageSizeMm("210")).toBe(false);
    expect(isPageSizeMm(null)).toBe(false);
  });

  it("clamps untrusted dimensions into range", () => {
    expect(safePageSizeMm(-100)).toBe(PAGE_SIZE_MM_MIN);
    expect(safePageSizeMm(1e9)).toBe(PAGE_SIZE_MM_MAX);
    expect(safePageSizeMm(Number.NaN)).toBe(PAGE_SIZE_MM_MIN);
    expect(safePageSizeMm(210)).toBe(210);
  });
});

describe("customSizeProblem / pageAreaProblem", () => {
  it("only constrains the custom format", () => {
    expect(customSizeProblem(setup({ format: "A4" }))).toBeNull();
    expect(customSizeProblem(setup({ format: CUSTOM_PAGE_FORMAT }))).toMatch(/width and height/);
    expect(
      customSizeProblem(setup({ format: CUSTOM_PAGE_FORMAT, widthMm: 200, heightMm: 150 })),
    ).toBeNull();
    expect(
      customSizeProblem(setup({ format: CUSTOM_PAGE_FORMAT, widthMm: 5, heightMm: 150 })),
    ).toMatch(/between/);
  });

  it("flags margins that leave no usable area", () => {
    expect(
      pageAreaProblem({
        format: "A4",
        orientation: "portrait",
        widthMm: null,
        heightMm: null,
        margins: { top: 20, right: 18, bottom: 20, left: 18 },
      }),
    ).toBeNull();
    // 30 × 30 custom with 20/18 margins → negative usable width.
    expect(
      pageAreaProblem({
        format: CUSTOM_PAGE_FORMAT,
        orientation: "portrait",
        widthMm: 30,
        heightMm: 30,
        margins: { top: 20, right: 18, bottom: 20, left: 18 },
      }),
    ).toMatch(/no usable page area/);
    // A positive but sub-minimum usable sliver is still rejected.
    expect(
      pageAreaProblem({
        format: CUSTOM_PAGE_FORMAT,
        orientation: "portrait",
        widthMm: 10,
        heightMm: 10,
        margins: { top: 4.6, right: 4.6, bottom: 4.6, left: 4.6 },
      }),
    ).toMatch(/no usable page area/);
  });
});

describe("pageFormatPatch (format switching)", () => {
  it("seeds a custom pair from the CURRENT effective size", () => {
    expect(pageFormatPatch(setup(), CUSTOM_PAGE_FORMAT)).toEqual({
      format: CUSTOM_PAGE_FORMAT,
      widthMm: 210,
      heightMm: 297,
    });
    expect(
      pageFormatPatch(setup({ orientation: "landscape" }), CUSTOM_PAGE_FORMAT),
    ).toEqual({ format: CUSTOM_PAGE_FORMAT, widthMm: 297, heightMm: 210 });
  });

  it("retains an authored custom pair and never rewrites it", () => {
    expect(
      pageFormatPatch(
        setup({ format: CUSTOM_PAGE_FORMAT, widthMm: 200, heightMm: 150 }),
        CUSTOM_PAGE_FORMAT,
      ),
    ).toEqual({ format: CUSTOM_PAGE_FORMAT });
  });

  it("keeps retained dimensions inactive when switching to a standard format", () => {
    expect(
      pageFormatPatch(setup({ format: CUSTOM_PAGE_FORMAT, widthMm: 200, heightMm: 150 }), "A4"),
    ).toEqual({ format: "A4" });
  });
});

describe("pageSetupSchema", () => {
  it("defaults to A4 portrait with the current margins and no custom size", () => {
    const parsed = pageSetupSchema.parse({});
    expect(parsed).toEqual({
      format: "A4",
      orientation: "portrait",
      margins: { top: 20, right: 18, bottom: 20, left: 18 },
      widthMm: null,
      heightMm: null,
      pageNumberStart: 1,
      showPageNumber: true,
    });
  });

  it("rejects Custom without dimensions and merges the area check", () => {
    expect(pageSetupSchema.safeParse({ format: CUSTOM_PAGE_FORMAT }).success).toBe(false);
    expect(
      pageSetupSchema.safeParse({
        format: CUSTOM_PAGE_FORMAT,
        widthMm: 200,
        heightMm: 150,
      }).success,
    ).toBe(true);
  });

  it("enforces the dimension bounds even for retained (inactive) values", () => {
    expect(
      pageSetupSchema.safeParse({ format: "A4", widthMm: PAGE_SIZE_MM_MAX + 1, heightMm: 100 })
        .success,
    ).toBe(false);
    expect(
      pageSetupSchema.safeParse({ format: "A4", widthMm: 200, heightMm: 150 }).success,
    ).toBe(true);
  });

  it("rejects a degenerate usable area", () => {
    const result = pageSetupSchema.safeParse({
      format: CUSTOM_PAGE_FORMAT,
      widthMm: 30,
      heightMm: 30,
      margins: { top: 20, right: 18, bottom: 20, left: 18 },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join(".") === "margins")).toBe(true);
    }
  });

  it("is applied as the section default", () => {
    const section = sectionSchema.parse({ id: "sec_aaaaaaaa", type: "section" });
    expect(section.pageSetup.format).toBe("A4");
    expect(section.pageSetup.widthMm).toBeNull();
  });
});

describe("createSection defaults (legacy documents stay A4 portrait)", () => {
  it("starts on A4 portrait with the standard margins and no custom size", () => {
    const section = createSection([]);
    expect(section.pageSetup).toEqual({
      format: "A4",
      orientation: "portrait",
      margins: { top: 20, right: 18, bottom: 20, left: 18 },
      widthMm: null,
      heightMm: null,
      pageNumberStart: 1,
      showPageNumber: true,
    });
  });
});

describe("new-document defaults (preferences)", () => {
  it("built-in defaults match the Phase-0 new-document behavior", () => {
    const prefs = defaultPreferences();
    expect(prefs.pageSetup.format).toBe("A4");
    expect(prefs.pageSetup.orientation).toBe("portrait");
    expect(prefs.theme).toBe("lab_default");
    expect(prefs.metadata).toEqual({
      docNumber: "",
      revision: "",
      author: "",
      organization: "",
      description: "",
    });
  });

  it("falls back to defaults for unknown / corrupt / wrong-version input", () => {
    expect(normalizePreferences(null)).toEqual(defaultPreferences());
    expect(normalizePreferences({ version: 2, defaults: {} })).toEqual(defaultPreferences());
    expect(normalizePreferences("nonsense")).toEqual(defaultPreferences());
    // Out-of-range page setup inside an otherwise valid envelope.
    const broken = {
      version: 1,
      defaults: {
        ...defaultPreferences(),
        pageSetup: { ...defaultPreferences().pageSetup, widthMm: 99999 },
      },
    };
    expect(normalizePreferences(broken)).toEqual(defaultPreferences());
  });

  it("falls back to the default theme for unknown theme ids", () => {
    expect(safeThemeId("bw_standard")).toBe("bw_standard");
    expect(safeThemeId("does_not_exist")).toBe("lab_default");
    expect(
      normalizePreferences({
        version: 1,
        defaults: { ...defaultPreferences(), theme: "does_not_exist" },
      }).theme,
    ).toBe("lab_default");
  });

  it("round-trips through storage, and reset clears it", () => {
    const { storage } = memoryStorage();
    expect(loadPreferences(storage)).toEqual(defaultPreferences());

    const custom = defaultPreferences();
    custom.pageSetup = {
      ...custom.pageSetup,
      format: CUSTOM_PAGE_FORMAT,
      widthMm: 200,
      heightMm: 150,
    };
    custom.theme = "bw_standard";
    custom.metadata.author = "Q. Manager";
    savePreferences(custom, storage);
    expect(loadPreferences(storage)).toEqual(custom);

    expect(resetStoredPreferences(storage)).toEqual(defaultPreferences());
    expect(loadPreferences(storage)).toEqual(defaultPreferences());
  });

  it("never throws on missing, corrupt or hostile storage", () => {
    const corrupt = memoryStorage({ [PREFERENCES_STORAGE_KEY]: "{not json" });
    expect(loadPreferences(corrupt.storage)).toEqual(defaultPreferences());

    const throwing: StorageLike = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    };
    expect(loadPreferences(throwing)).toEqual(defaultPreferences());
    expect(() => savePreferences(defaultPreferences(), throwing)).not.toThrow();
    expect(resetStoredPreferences(throwing)).toEqual(defaultPreferences());
  });

  it("applies a validated snapshot to a new document without touching title", () => {
    const doc = createEmptyDocument("Untitled document");
    const prefs = defaultPreferences();
    prefs.pageSetup = {
      ...prefs.pageSetup,
      format: CUSTOM_PAGE_FORMAT,
      widthMm: 200,
      heightMm: 150,
    };
    prefs.theme = "bw_standard";
    prefs.metadata = {
      docNumber: "SOP-100",
      revision: "01",
      author: "A. Analyst",
      organization: "Lab",
      description: "seeded",
    };

    applyNewDocumentDefaults(doc, prefs);

    expect(doc.metadata.title).toBe("Untitled document");
    expect(doc.metadata.docNumber).toBe("SOP-100");
    expect(doc.metadata.description).toBe("seeded");
    expect(doc.settings.theme).toBe("bw_standard");
    expect(doc.sections[0].pageSetup.format).toBe(CUSTOM_PAGE_FORMAT);
    expect(doc.sections[0].pageSetup.widthMm).toBe(200);
  });
});
