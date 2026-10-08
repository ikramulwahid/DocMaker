/** Globals observed in the preview iframe / layout HTML. */
declare global {
  interface Window {
    __layoutDone?: boolean;
  }
}

export {};
