/**
 * Live preview: the SAME renderLayout() output the PDF exporter prints.
 * Paged.js paginates it inside the iframe; the srcdoc update is debounced so
 * typing stays smooth. There is intentionally no second renderer here.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { renderLayout } from "@/core/layout";
import { tryResolve, useDocStore } from "@/store";

/** Resolved at runtime: works from vite dev, built assets, and Tauri. */
function pagedJsSrc(): string {
  return new URL("paged.polyfill.js", document.baseURI).href;
}

interface LayoutOutput {
  html?: string;
  error?: string;
}

export function Preview() {
  const document_ = useDocStore((s) => s.document);
  const [srcDoc, setSrcDoc] = useState("");
  const [rendering, setRendering] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const layout = useMemo<LayoutOutput>(() => {
    const result = tryResolve(document_);
    if (!result.ok) return { error: result.error };
    try {
      return {
        html: renderLayout(result.resolved, { pagedJsSrc: pagedJsSrc() }),
      };
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }, [document_]);

  // Debounced push into the iframe.
  useEffect(() => {
    if (layout.error !== undefined) return;
    const timer = window.setTimeout(() => setSrcDoc(layout.html ?? ""), 250);
    return () => window.clearTimeout(timer);
  }, [layout]);

  // Rendering indicator: cleared when Paged.js finishes paginating.
  useEffect(() => {
    if (!srcDoc) return;
    setRendering(true);
    let cancelled = false;
    const started = Date.now();
    const poll = window.setInterval(() => {
      const win = iframeRef.current?.contentWindow as
        | (Window & { __layoutDone?: boolean })
        | null;
      if (win?.__layoutDone || cancelled || Date.now() - started > 30_000) {
        if (!cancelled) setRendering(false);
        window.clearInterval(poll);
      }
    }, 150);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, [srcDoc]);

  return (
    <div className="preview-pane">
      <div className="preview-bar">
        <span>Preview (A4)</span>
        <span
          className={rendering ? "badge busy" : "badge"}
          data-testid="render-status"
        >
          {layout.error ? "layout error" : rendering ? "rendering…" : "ready"}
        </span>
      </div>
      {layout.error !== undefined ? (
        <div className="preview-error" role="alert">
          {layout.error}
        </div>
      ) : (
        <iframe
          id="preview-frame"
          name="preview"
          title="Document preview"
          ref={iframeRef}
          className="preview-frame"
          srcDoc={srcDoc}
          data-testid="preview"
        />
      )}
    </div>
  );
}
