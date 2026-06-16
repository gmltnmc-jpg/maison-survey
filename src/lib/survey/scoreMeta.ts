import { QUESTIONS } from "./questions";

/**
 * Health-score SCAFFOLD ONLY. No scoring formula is implemented yet (요청서 12번).
 * This exposes the candidate domains and which questions feed each, so a future
 * scoring pass has a stable structure to build on. Scores are a counseling
 * reference, never a diagnosis shown to patients.
 */
export const SCORE_DOMAINS = [
  "수면",
  "식욕·식습관",
  "식사 규칙성",
  "소화",
  "부종",
  "피로·에너지",
  "생리주기",
  "체중 변화",
  "운동량",
  "복약/기호식품",
  "수분",
] as const;

export type ScoreDomain = (typeof SCORE_DOMAINS)[number];

/** Maps each score domain to the question IDs flagged as score candidates. */
export const SCORE_CANDIDATES: Record<string, string[]> = QUESTIONS.filter(
  (q) => q.scoreCandidate,
).reduce<Record<string, string[]>>((acc, q) => {
  const domain = q.scoreDomain ?? "기타";
  (acc[domain] ??= []).push(q.id);
  return acc;
}, {});
