import type { ResponseStatus } from "@/lib/types";

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return phone;
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
}

export function maskRrn(rrnMask: string | null | undefined): string {
  return rrnMask || "-";
}

export function calcAgeFromRrnMask(rrnMask: string | null | undefined): number | null {
  if (!rrnMask) return null;
  const match = rrnMask.match(/^(\d{6})-(\d)/);
  if (!match) return null;
  const [, ymd, gDigit] = match;
  const yy = parseInt(ymd.slice(0, 2), 10);
  const mm = parseInt(ymd.slice(2, 4), 10);
  const dd = parseInt(ymd.slice(4, 6), 10);
  const g = parseInt(gDigit, 10);

  let birthYear: number;
  if (g === 1 || g === 2) birthYear = 1900 + yy;
  else if (g === 3 || g === 4) birthYear = 2000 + yy;
  else return null;

  const today = new Date();
  let age = today.getFullYear() - birthYear;
  const hasBirthdayPassed =
    today.getMonth() + 1 > mm ||
    (today.getMonth() + 1 === mm && today.getDate() >= dd);
  if (!hasBirthdayPassed) age--;
  return age >= 0 ? age : null;
}

export type BmiLevel = "low" | "normal" | "caution" | "high";

export function bmiCategory(bmi: number): { label: string; level: BmiLevel } {
  if (bmi < 18.5) return { label: "저체중", level: "low" };
  if (bmi < 23) return { label: "정상", level: "normal" };
  if (bmi < 25) return { label: "과체중", level: "caution" };
  return { label: "비만", level: "high" };
}

export function calcTargetBmi(
  targetWeight: number | null,
  height: number | null,
): number | null {
  if (!targetWeight || !height || height === 0) return null;
  const m = height / 100;
  return Math.round((targetWeight / (m * m)) * 10) / 10;
}

export type RiskFlagItem = { code: string; label: string } | string;

export function summarizeRiskFlags(
  riskFlags: RiskFlagItem[] | null | undefined,
): { count: number; items: string[] } {
  if (!riskFlags || riskFlags.length === 0) return { count: 0, items: [] };
  const items = riskFlags.map((f) => (typeof f === "string" ? f : f.label));
  return { count: items.length, items };
}

const STATUS_TRANSITIONS: Record<ResponseStatus, ResponseStatus[]> = {
  "신규 제출": ["상담 예정", "보류·취소"],
  "상담 예정": ["상담 완료", "신규 제출", "보류·취소"],
  "상담 완료": ["신규 제출", "보류·취소"],
  "보류·취소": ["신규 제출"],
};

export function allowedNextStatus(current: string): ResponseStatus[] {
  return STATUS_TRANSITIONS[current as ResponseStatus] ?? [];
}

export const STATUS_BADGE: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  "신규 제출": {
    bg:     "var(--color-info-soft-bg)",
    color:  "var(--color-info-soft)",
    border: "var(--color-border)",
  },
  "상담 예정": {
    bg:     "var(--color-info-soft-bg)",
    color:  "var(--color-info-soft)",
    border: "var(--color-border)",
  },
  "상담 완료": {
    bg:     "var(--color-success-soft-bg)",
    color:  "var(--color-success-soft)",
    border: "var(--color-border)",
  },
  "보류·취소": {
    bg:     "var(--color-surface-muted)",
    color:  "var(--color-text-muted)",
    border: "var(--color-border)",
  },
};

export const BMI_COLOR: Record<BmiLevel, string> = {
  low:     "var(--color-info-soft)",
  normal:  "var(--color-success-soft)",
  caution: "var(--color-warning-soft)",
  high:    "var(--color-danger-soft)",
};
