import type { Answers, AnswerValue } from "./types";
import { computeTargetBmi } from "./derive";

export type RiskFlag = { code: string; label: string };

function arr(value: AnswerValue | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value) return [value];
  return [];
}

function has(value: AnswerValue | undefined, needle: string): boolean {
  return arr(value).includes(needle);
}

/**
 * Counselor-facing review flags. NOT a diagnosis and NEVER shown to patients.
 * Mirrors 요청서 9번.
 */
export function computeRiskFlags(answers: Answers): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const push = (code: string, label: string) => flags.push({ code, label });

  const conditions = answers["medical_conditions"];
  if (has(conditions, "고혈압·심혈관 질환")) push("cond_cardio", "고혈압·심혈관 질환");
  if (has(conditions, "당뇨·공복혈당장애")) push("cond_diabetes", "당뇨·공복혈당장애");
  if (has(conditions, "갑상선 질환")) push("cond_thyroid", "갑상선 질환");
  if (has(conditions, "신장 질환")) push("cond_kidney", "신장 질환");

  const meds = answers["medical_medications"];
  if (has(meds, "수면제·신경안정제·항우울제")) push("med_psych", "수면제·신경안정제·항우울제 복용");
  if (has(meds, "스테로이드제")) push("med_steroid", "스테로이드제 복용");
  if (has(meds, "피임약·피임 시술")) push("med_contraceptive", "피임약·피임 시술");

  if (answers["medical_food_allergy"] === "있음") push("food_allergy", "음식 알레르기 있음");

  const sleepAid = answers["sleep_aid_use"];
  if (sleepAid === "가끔 복용" || sleepAid === "정기적으로 복용 중") {
    push("sleep_aid", "수면 보조제·안정제 복용");
  }
  if (has(answers["sleep_quality"], "거의 날을 새우다시피 한다")) {
    push("sleep_severe", "수면 거의 못 함");
  }
  if (has(answers["meal_habits"], "폭식 후 죄책감을 느낀 경험이 있다")) {
    push("binge_guilt", "폭식 후 죄책감 경험");
  }
  if (answers["meal_appetite"] === "최근 들어 입맛이 많이 떨어졌다") {
    push("appetite_drop", "최근 식욕 저하");
  }

  const urine = answers["urine_color"];
  if (urine === "주황색 또는 갈색") push("urine_dark", "소변 주황·갈색");
  if (urine === "거품이 섞여 있다") push("urine_foam", "소변 거품");

  if (has(answers["signal_temp_energy"], "최근 들어 컨디션이 많이 떨어졌다")) {
    push("energy_drop", "최근 컨디션 저하");
  }
  if (has(answers["signal_edema_area"], "전신")) push("edema_whole", "전신 부종");

  const targetBmi = computeTargetBmi(answers);
  if (targetBmi != null && targetBmi < 18.5) {
    push("target_underweight", `목표 BMI 저체중(${targetBmi.toFixed(1)})`);
  }

  return flags;
}
