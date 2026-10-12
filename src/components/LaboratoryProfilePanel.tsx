/**
 * Laboratory profile panel (M5 — V1-META-002).
 *
 * The laboratory profile is DOCUMENT-SCOPED data stored in the `.labdoc.json`
 * (name, address, logo). The logo is an embedded image subject to the same
 * allow-list as any other image: the file is read as a data URI and only
 * accepted when `sanitizeImageSrc` approves it, so an unsupported type, a
 * remote URL or an oversized payload is refused BEFORE it enters the IR with an
 * actionable message (AGENTS.md §27/§33).
 */
import { useRef } from "react";
import { sanitizeImageSrc } from "@/core/ir/sanitize";
import { useDocStore } from "@/store";
import { Field } from "./Field";

export function LaboratoryProfilePanel() {
  const profile = useDocStore((s) => s.document.laboratoryProfile);
  const setLaboratoryProfile = useDocStore((s) => s.setLaboratoryProfile);
  const setStatus = useDocStore((s) => s.setStatus);
  const fileRef = useRef<HTMLInputElement>(null);

  const safeLogo = profile.logo ? sanitizeImageSrc(profile.logo) : null;

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === "string" ? reader.result : "";
      if (sanitizeImageSrc(src) === null) {
        const contentType = file.type || "unknown";
        setStatus(
          `Logo rejected: unsupported image type (${contentType}) — allowed: png, jpeg, gif, webp, bmp, svg (embedded data URI, max 10 MiB)`,
        );
        return;
      }
      setLaboratoryProfile({ logo: src });
    };
    reader.onerror = () => setStatus("Logo file could not be read");
    reader.readAsDataURL(file);
  };

  return (
    <section>
      <h2>Laboratory profile</h2>
      <p className="hint">
        Stored in this document. Reference fields with the picker:
        {" {{laboratory.name}} "}and{" {{laboratory.logo}}"}.
      </p>
      <Field
        label="Laboratory name"
        value={profile.name}
        onChange={(v) => setLaboratoryProfile({ name: v })}
      />
      <Field
        label="Address"
        wide
        value={profile.address}
        onChange={(v) => setLaboratoryProfile({ address: v })}
      />
      <div className="field wide" data-testid="lab-logo-field">
        <span>Logo</span>
        {safeLogo ? (
          <div className="logo-preview">
            <img src={safeLogo} alt="Laboratory logo preview" data-testid="lab-logo-preview" />
            <button
              type="button"
              className="tool"
              data-testid="lab-logo-remove"
              onClick={() => setLaboratoryProfile({ logo: null })}
            >
              Remove logo
            </button>
          </div>
        ) : (
          <p className="hint">
            No logo set. A logo used in the document body is reported as an
            unresolved field until one is set.
          </p>
        )}
        <label className="hint">
          <span>Choose logo image</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp,image/bmp,image/svg+xml"
            data-testid="lab-logo-input"
            aria-label="Laboratory logo image"
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              if (fileRef.current) fileRef.current.value = "";
            }}
          />
        </label>
      </div>
    </section>
  );
}
