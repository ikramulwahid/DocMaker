/** Type surface for scripts/verify-pdf-text.mjs (imported by e2e specs). */
export interface PdfTextPage {
  page: number;
  text: string;
}

export interface PdfTextHit {
  page: number;
  kind: "verbatim" | "collapsed";
}

export function collapseText(text: string): string;

/** Extract the text layer of a PDF buffer (Uint8Array) or file path. */
export function extractPdfTextByPage(
  source: Uint8Array | string,
): Promise<PdfTextPage[]>;

export function extractPdfText(source: Uint8Array | string): Promise<string>;

/** Pages where `expected` appears verbatim or whitespace-collapsed. */
export function findPageHits(
  pages: PdfTextPage[],
  expected: string,
): PdfTextHit[];