import "server-only";
import crypto from "node:crypto";

/**
 * RRN (주민등록번호) encryption — SERVER ONLY.
 *
 * AES-256-GCM. The key lives only in RRN_ENC_KEY (env), never in code/Git/the
 * client bundle. Losing the key makes stored ciphertext unrecoverable.
 */

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;

function getKey(): Buffer {
  const raw = process.env.RRN_ENC_KEY;
  if (!raw) {
    throw new Error("RRN_ENC_KEY is not set");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("RRN_ENC_KEY must decode to 32 bytes (base64-encoded)");
  }
  return key;
}

/** Encrypts a 13-digit RRN. Returns "iv:tag:ciphertext" (each base64). */
export function encryptRrn(rrn: string): string {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(rrn, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

/** Decrypts a payload produced by {@link encryptRrn}. Admin/server use only. */
export function decryptRrn(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid RRN ciphertext format");
  }
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/**
 * Masked form for list / detail / PDF: keep the 6 birth digits + the gender
 * digit, hide the rest. "9010101234567" -> "901010-1******".
 */
export function maskRrn(rrn: string): string {
  const digits = rrn.replace(/\D/g, "");
  if (digits.length < 7) {
    return "*".repeat(Math.max(digits.length, 1));
  }
  return `${digits.slice(0, 6)}-${digits[6]}******`;
}
