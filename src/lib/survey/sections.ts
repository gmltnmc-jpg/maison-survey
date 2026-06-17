import type { SectionCode } from "@/lib/types";

export type SectionMeta = {
  code: SectionCode;
  no: string;
  title: string;
  en: string;
  intro?: string;
  /** Shown to patients only when this predicate passes (section-level gating). */
  showWhen?: { questionId: string; equals: string };
};

/**
 * Patient input order (요청서 2번). The `female` section is gated to 여성.
 */
export const SECTIONS: SectionMeta[] = [
  { code: "basic", no: "01", title: "기본 정보", en: "Basic Information" },
  {
    code: "consent",
    no: "02",
    title: "개인정보 동의",
    en: "Privacy Consent",
    intro:
      "맞춤 진료와 예약 안내를 위해 개인정보·건강정보·민감 건강정보를 수집·활용하는 데 동의해 주세요.",
  },
  {
    code: "goal",
    no: "03",
    title: "몸의 목표와 기대",
    en: "Goals & Expectations",
    intro: "이 설문에서 가장 중요한 부분입니다. 원하시는 변화를 있는 그대로 말씀해 주세요.",
  },
  { code: "body_metrics", no: "04", title: "신체 계측", en: "Body Metrics" },
  {
    code: "diet_history",
    no: "05",
    title: "다이어트 이력",
    en: "Diet History",
    intro: "과거의 경험이 지금의 몸을 만든 맥락입니다. 솔직하게 공유해 주세요.",
  },
  {
    code: "sleep",
    no: "06",
    title: "수면 리듬",
    en: "Sleep Rhythm",
    intro: "수면은 대사와 호르몬의 가장 중요한 기반입니다.",
  },
  { code: "meal", no: "07", title: "식사 리듬", en: "Meal Rhythm" },
  { code: "alcohol_caffeine", no: "08", title: "음주 · 카페인", en: "Alcohol & Caffeine" },
  { code: "hydration", no: "09", title: "수분 리듬", en: "Water & Mineral" },
  { code: "body_signal", no: "10", title: "몸의 신호", en: "Body Signals" },
  {
    code: "female",
    no: "11",
    title: "여성 건강 리듬",
    en: "Women's Rhythm",
    showWhen: { questionId: "basic_sex", equals: "여성" },
  },
  { code: "medical", no: "12", title: "건강 이력", en: "Medical History" },
  { code: "lifestyle", no: "13", title: "생활 패턴", en: "Lifestyle" },
  { code: "family", no: "14", title: "가족력", en: "Family History" },
  { code: "final", no: "15", title: "마지막 질문", en: "One Last Thing" },
];

/**
 * Counselor dashboard reading order (요청서 10번). Differs from input order:
 * identity/consent → risk → goal → metrics → medical → family → female →
 * lifestyle rhythms → signals → diet → free text.
 */
export const DASHBOARD_SECTION_ORDER: SectionCode[] = [
  "basic",
  "consent",
  "goal",
  "body_metrics",
  "medical",
  "lifestyle",
  "family",
  "female",
  "sleep",
  "meal",
  "alcohol_caffeine",
  "hydration",
  "body_signal",
  "diet_history",
  "final",
];

export const SECTION_BY_CODE: Record<SectionCode, SectionMeta> = Object.fromEntries(
  SECTIONS.map((s) => [s.code, s]),
) as Record<SectionCode, SectionMeta>;
