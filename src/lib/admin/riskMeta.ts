/**
 * 위험신호 severity 메타데이터 (§G-3 명세 기준).
 * riskFlags.ts의 computeRiskFlags()가 severity 없이 {code,label}만 반환하므로
 * 표시 레이어에서 code → severity를 조회하고, 미등록 code는 medium 폴백.
 */

export type RiskSeverity = "high" | "medium" | "low";

export const RISK_SEVERITY_MAP: Record<string, RiskSeverity> = {
  // high — 상담 전 확인
  cond_cardio:        "high",
  cond_diabetes:      "high",
  cond_kidney:        "high",
  urine_foam:         "high",
  edema_whole:        "high",
  target_underweight: "high",
  // medium — 확인 필요
  cond_thyroid: "medium",
  med_psych:    "medium",
  med_steroid:  "medium",
  sleep_severe: "medium",
  urine_dark:   "medium",
  binge_guilt:  "medium",
  // low — 참고
  med_contraceptive: "low",
  food_allergy:      "low",
  sleep_aid:         "low",
  appetite_drop:     "low",
  energy_drop:       "low",
};

/** severity 없거나 미등록 code면 medium 폴백 (§0-1 legacy 처리) */
export function getRiskSeverity(code: string, stored?: string): RiskSeverity {
  if (stored === "high" || stored === "medium" || stored === "low") return stored;
  return RISK_SEVERITY_MAP[code] ?? "medium";
}

export const SEVERITY_LABEL: Record<RiskSeverity, string> = {
  high:   "상담 전 확인",
  medium: "확인 필요",
  low:    "참고",
};

/** high+medium 개수 집계 (low 제외 — §G-2) */
export function summarizeRiskSeverity(
  flags: Array<{ code: string; severity?: string } | string>,
): { highCount: number; mediumCount: number; lowCount: number } {
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  for (const f of flags) {
    const code = typeof f === "string" ? f : f.code;
    const stored = typeof f === "string" ? undefined : (f as { severity?: string }).severity;
    const sev = getRiskSeverity(code, stored);
    if (sev === "high") highCount++;
    else if (sev === "medium") mediumCount++;
    else lowCount++;
  }

  return { highCount, mediumCount, lowCount };
}
