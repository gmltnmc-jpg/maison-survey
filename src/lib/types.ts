/**
 * Shared types. The survey question model and section codes are filled in
 * during step F (survey definition single source). Kept minimal for scaffolding.
 */

export type SectionCode =
  | "basic"
  | "consent"
  | "goal"
  | "body_metrics"
  | "diet_history"
  | "sleep"
  | "meal"
  | "alcohol_caffeine"
  | "hydration"
  | "body_signal"
  | "female"
  | "medical"
  | "lifestyle"
  | "family"
  | "final";

export type ResponseStatus =
  | "신규 제출"
  | "검토 중"
  | "상담 예정"
  | "상담 완료"
  | "보류·취소";
