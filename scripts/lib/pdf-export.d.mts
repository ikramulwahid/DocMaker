/** Type surface for scripts/lib/pdf-export.mjs (imported by e2e specs). */
export interface PdfRun {
  range: string;
  size: { w: string; h: string };
  pages: number;
}

export interface PdfExportResult {
  pdf: Uint8Array;
  pages: number;
  runs: PdfRun[];
  boxes: string[];
}

export function exportPaginatedPdf(options: {
  html: string;
  outputPath?: string;
  timeoutMs?: number;
}): Promise<PdfExportResult>;

export function pageSizes(buffer: Uint8Array): Promise<string[]>;

export function groupRuns(sizes: Array<{ w: string; h: string }>): PdfRun[];
