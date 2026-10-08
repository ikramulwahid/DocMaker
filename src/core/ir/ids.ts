import type { IdPrefix, NodeId } from "./schema";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

function randomChars(count: number): string {
  const bytes = new Uint8Array(count);
  const cryptoObj = globalThis.crypto;
  if (cryptoObj?.getRandomValues) {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < count; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = "";
  for (let i = 0; i < count; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/**
 * Stable semantic node ID: prefix + random suffix. Never derived from
 * visible numbering (AGENTS.md), so renumbering can never break identity.
 */
export function newId(prefix: IdPrefix): NodeId {
  return `${prefix}_${randomChars(8)}`;
}

export function isNodeId(value: unknown): value is NodeId {
  return typeof value === "string" && /^[a-z]{2,3}_[a-z0-9]{6,24}$/.test(value);
}
