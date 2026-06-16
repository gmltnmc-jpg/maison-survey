import type { Answers, AnswerValue, SurveyQuestion } from "./types";
import { QUESTION_BY_ID } from "./questions";
import { SECTION_BY_CODE } from "./sections";

function asArray(value: AnswerValue | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return value ? [value] : [];
  if (value && typeof value === "object") return Object.values(value);
  return [];
}

function isEmpty(value: AnswerValue | undefined): boolean {
  if (value == null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return String(value).trim() === "";
}

/** Evaluates a question's `conditional`. Questions without one are always shown. */
export function isQuestionVisible(question: SurveyQuestion, answers: Answers): boolean {
  const cond = question.conditional;
  if (!cond) return true;

  const target = answers[cond.questionId];
  switch (cond.operator) {
    case "equals":
      return target === cond.value;
    case "not_equals":
      // Hidden until the controlling question is answered with something other
      // than `value`. An unanswered control keeps the dependent hidden.
      return !isEmpty(target) && target !== cond.value;
    case "includes":
      return cond.value != null && asArray(target).includes(cond.value);
    case "not_empty":
      return !isEmpty(target);
    default:
      return true;
  }
}

/** Section-level gating (e.g. female section only for 여성). */
export function isSectionVisible(
  sectionCode: SurveyQuestion["section"],
  answers: Answers,
): boolean {
  const meta = SECTION_BY_CODE[sectionCode];
  if (!meta?.showWhen) return true;
  return answers[meta.showWhen.questionId] === meta.showWhen.equals;
}

/** True when the question should be collected/validated given current answers. */
export function isQuestionActive(question: SurveyQuestion, answers: Answers): boolean {
  return isSectionVisible(question.section, answers) && isQuestionVisible(question, answers);
}

/**
 * Strips answers for questions hidden by current conditions/section gating so
 * they are not persisted. Keeps the dataset consistent with what was shown.
 */
export function pruneHiddenAnswers(answers: Answers): Answers {
  const result: Answers = {};
  for (const [id, value] of Object.entries(answers)) {
    const question = QUESTION_BY_ID[id];
    if (!question) continue;
    if (isQuestionActive(question, answers) && !isEmpty(value)) {
      result[id] = value;
    }
  }
  return result;
}
