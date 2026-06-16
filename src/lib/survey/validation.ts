import type { Answers, AnswerValue } from "./types";
import { QUESTIONS, QUESTION_BY_ID } from "./questions";
import { isQuestionActive } from "./conditions";

export type ValidationError = { questionId: string; message: string };

const SOFT = {
  required: "이 질문에 답해 주시면 상담에 큰 도움이 됩니다.",
  rrn: "주민등록번호 13자리를 '-' 없이 숫자로 입력해 주세요.",
  phone: "연락처를 다시 한 번 확인해 주세요. (예: 01012345678)",
  consent: "상담 진행을 위해 동의가 필요합니다.",
  number: "숫자로 입력해 주세요.",
  weight: "체중을 다시 한 번 확인해 주세요.",
  height: "키를 다시 한 번 확인해 주세요.",
  time: "시간을 HH:MM 형식으로 입력해 주세요.",
};

export function normalizeRrn(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidRrn(value: string): boolean {
  return /^\d{13}$/.test(normalizeRrn(value));
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return /^01\d{8,9}$/.test(digits);
}

function isEmpty(value: AnswerValue | undefined): boolean {
  if (value == null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return String(value).trim() === "";
}

function isConsented(value: AnswerValue | undefined): boolean {
  return value === "동의합니다" || value === "동의" || value === "yes";
}

/** Field-level format checks (skipped when the field is empty & optional). */
function formatError(id: string, value: AnswerValue | undefined): string | null {
  if (isEmpty(value)) return null;
  const str = typeof value === "string" ? value : "";
  switch (id) {
    case "basic_rrn":
      return isValidRrn(str) ? null : SOFT.rrn;
    case "basic_phone":
      return isValidPhone(str) ? null : SOFT.phone;
    case "body_weight_current":
    case "body_weight_target":
    case "body_weight_min":
    case "body_weight_pre_birth":
    case "body_weight_post_birth": {
      const n = Number(str);
      if (Number.isNaN(n)) return SOFT.number;
      return n > 20 && n < 300 ? null : SOFT.weight;
    }
    case "body_height": {
      const n = Number(str);
      if (Number.isNaN(n)) return SOFT.number;
      return n > 100 && n < 250 ? null : SOFT.height;
    }
    default: {
      const q = QUESTION_BY_ID[id];
      if (q?.type === "number" && Number.isNaN(Number(str))) return SOFT.number;
      if (q?.type === "time" && !/^\d{1,2}:\d{2}$/.test(str)) return SOFT.time;
      return null;
    }
  }
}

/** Validates every active question. Returns errors keyed for the UI. */
export function validateAnswers(answers: Answers): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const q of QUESTIONS) {
    if (!isQuestionActive(q, answers)) continue;
    const value = answers[q.id];

    if (q.required && isEmpty(value)) {
      errors.push({ questionId: q.id, message: SOFT.required });
      continue;
    }
    if (q.id === "consent_agree" && q.required && !isConsented(value)) {
      errors.push({ questionId: q.id, message: SOFT.consent });
      continue;
    }
    const fmt = formatError(q.id, value);
    if (fmt) errors.push({ questionId: q.id, message: fmt });
  }
  return errors;
}

/** Validates only the questions belonging to one section (client step). */
export function validateSection(
  sectionCode: string,
  answers: Answers,
): ValidationError[] {
  return validateAnswers(answers).filter(
    (e) => QUESTION_BY_ID[e.questionId]?.section === sectionCode,
  );
}
