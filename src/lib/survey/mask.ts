/**
 * Display masking for the dashboard / PDF. RRN masking lives in
 * `@/lib/crypto/rrn` (maskRrn) since it sits next to encryption.
 */

/** "01012345678" -> "010-****-5678". Keeps prefix + last 4. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return phone;
  const head = digits.slice(0, 3);
  const tail = digits.slice(-4);
  return `${head}-****-${tail}`;
}
