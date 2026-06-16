import type { Answers, AnswerValue } from "./types";

function num(value: AnswerValue | undefined): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function bmi(weightKg: number | null, heightCm: number | null): number | null {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

/** Promoted scalar columns derived from raw answers, for dashboard/filtering. */
export type DerivedFields = {
  primary_goal_text: string | null;
  chief_complaints: string[];
  current_weight: number | null;
  height: number | null;
  target_weight: number | null;
  bmi: number | null;
};

export function computeCurrentBmi(answers: Answers): number | null {
  return bmi(num(answers["body_weight_current"]), num(answers["body_height"]));
}

export function computeTargetBmi(answers: Answers): number | null {
  return bmi(num(answers["body_weight_target"]), num(answers["body_height"]));
}

export function deriveFields(answers: Answers): DerivedFields {
  const goal = answers["goal_reason"] ?? answers["goal_3month"];
  const concerns = answers["goal_concern_areas"];
  const current = computeCurrentBmi(answers);
  return {
    primary_goal_text: typeof goal === "string" ? goal : null,
    chief_complaints: Array.isArray(concerns) ? concerns : [],
    current_weight: num(answers["body_weight_current"]),
    height: num(answers["body_height"]),
    target_weight: num(answers["body_weight_target"]),
    bmi: current != null ? Math.round(current * 10) / 10 : null,
  };
}
