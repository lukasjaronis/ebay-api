import crypto from "node:crypto";
import buffer from "node:buffer";

export default function applyPollyfill() {
  if (!globalThis.crypto) {
    Object.defineProperty(globalThis, "crypto", {
      value: crypto.webcrypto,
    });
  }

  if (!globalThis.File) {
    Object.defineProperty(globalThis, "File", {
      value: buffer.File,
    });
  }
}
