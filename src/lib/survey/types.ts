import type { SectionCode } from "@/lib/types";

export type QuestionType =
  | "short_text"
  | "long_text"
  | "single_choice"
  | "multiple_choice"
  | "number"
  | "time"
  | "date"
  | "scale_grid"
  | "yes_no";

export type Sensitivity =
  | "general"
  | "personal"
  | "unique_id"
  | "health"
  | "sensitive_health";

export type ConditionalOperator =
  | "equals"
  | "not_equals"
  | "includes"
  | "not_empty";

export type Conditional = {
  questionId: string;
  operator: ConditionalOperator;
  value?: string;
};

export type SurveyQuestion = {
  id: string;
  section: SectionCode;
  order: number;
  label: string;
  helperText?: string;
  placeholder?: string;
  type: QuestionType;
  options?: string[];
  /** Adds a free-text "기타" option to a choice question. */
  allowOther?: boolean;
  /** scale_grid only. */
  gridRows?: string[];
  gridCols?: string[];
  required: boolean;
  sensitivity: Sensitivity;
  dashboard: boolean;
  pdf: boolean;
  scoreCandidate: boolean;
  /** Score domain this question contributes to (meta only; no formula yet). */
  scoreDomain?: string;
  riskFlag: boolean;
  conditional?: Conditional;
};

/** A single submitted answer value. */
export type AnswerValue = string | string[] | Record<string, string>;

export type Answers = Record<string, AnswerValue>;
