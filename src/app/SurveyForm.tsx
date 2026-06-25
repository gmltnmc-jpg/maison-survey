"use client";

import { useMemo, useState } from "react";
import { SECTIONS } from "@/lib/survey/sections";
import { QUESTIONS } from "@/lib/survey/questions";
import { isQuestionVisible, isSectionVisible } from "@/lib/survey/conditions";
import { validateSection } from "@/lib/survey/validation";
import type { Answers, AnswerValue, SurveyQuestion } from "@/lib/survey/types";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";

const OTHER = "__other__";

type ErrorMap = Record<string, string>;

// ── Chapter mapping (§F-1) ──────────────────────────────────────

const CHAPTER_MAP: Record<string, { name: string; index: number }> = {
  basic:            { name: "기본 정보", index: 0 },
  consent:          { name: "기본 정보", index: 0 },
  goal:             { name: "목표", index: 1 },
  body_metrics:     { name: "몸 상태", index: 2 },
  diet_history:     { name: "몸 상태", index: 2 },
  sleep:            { name: "생활 리듬", index: 3 },
  meal:             { name: "생활 리듬", index: 3 },
  alcohol_caffeine: { name: "생활 리듬", index: 3 },
  hydration:        { name: "생활 리듬", index: 3 },
  body_signal:      { name: "생활 리듬", index: 3 },
  female:           { name: "건강", index: 4 },
  medical:          { name: "건강", index: 4 },
  lifestyle:        { name: "건강", index: 4 },
  family:           { name: "건강", index: 4 },
  final:            { name: "마무리", index: 5 },
};

// ── Helpers ──────────────────────────────────────────────────────

function materialize(answers: Answers, otherTexts: Record<string, string>): Answers {
  const out: Answers = {};
  for (const [id, value] of Object.entries(answers)) {
    if (Array.isArray(value)) {
      out[id] = value.map((v) => (v === OTHER ? `기타: ${otherTexts[id] ?? ""}`.trim() : v));
    } else if (value === OTHER) {
      out[id] = `기타: ${otherTexts[id] ?? ""}`.trim();
    } else {
      out[id] = value;
    }
  }
  return out;
}

/** "(kg)" / "(cm)" 등 단위 괄호를 라벨에서 분리 */
function parseLabel(label: string): { text: string; unit: string | null } {
  const match = label.match(/^(.*?)\s*\(([a-zA-Z%]+)\)\s*$/);
  if (!match) return { text: label, unit: null };
  return { text: match[1], unit: match[2] };
}

// ── Main form ────────────────────────────────────────────────────

export default function SurveyForm() {
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<ErrorMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  const visibleSections = useMemo(
    () => SECTIONS.filter((s) => isSectionVisible(s.code, answers)),
    [answers],
  );
  const section = visibleSections[step];

  const sectionQuestions = useMemo(() => {
    if (!section) return [];
    return QUESTIONS.filter(
      (q) => q.section === section.code && isQuestionVisible(q, answers),
    ).sort((a, b) => a.order - b.order);
  }, [section, answers]);

  const chapter = section ? (CHAPTER_MAP[section.code] ?? { name: section.title, index: 0 }) : null;
  const progressPct = Math.round(((step + 1) / visibleSections.length) * 100);
  const isFemaleSection = section?.code === "female";
  const hasErrors = Object.keys(errors).length > 0;

  function setValue(id: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function toggleMulti(id: string, option: string) {
    const current = Array.isArray(answers[id]) ? (answers[id] as string[]) : [];
    const next = current.includes(option)
      ? current.filter((v) => v !== option)
      : [...current, option];
    setValue(id, next);
  }

  function goNext() {
    if (!section) return;
    const materialized = materialize(answers, otherTexts);
    const sectionErrors = validateSection(section.code, materialized);
    if (sectionErrors.length) {
      const map: ErrorMap = {};
      sectionErrors.forEach((e) => (map[e.questionId] = e.message));
      setErrors(map);
      setTimeout(() => {
        const el = document.querySelector("[data-has-error='true']");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 40);
      return;
    }
    setErrors({});
    if (step < visibleSections.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      void submit(materialized);
    }
  }

  function goBack() {
    setStep(step - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(materialized: Answers) {
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: materialized }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `제출에 실패했습니다 (${res.status})`);
      }
      setSubmitted(true);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "전송 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── 인트로 화면 ───────────────────────────────────────────────

  if (!started) {
    return (
      <div className="survey-intro">
        <p className="survey-intro-brand">Maison de Balance</p>
        <div className="survey-intro-line" aria-hidden="true" />
        <h1 className="survey-intro-title">
          몸의 리듬을 이해하기 위한
          <br />
          사전 설문
        </h1>
        <div className="survey-intro-body">
          <p>
            체중만이 아닌 수면·식사·대사·호르몬 리듬까지 함께 살피기 위한
            설문입니다. 작성해 주신 내용은 초진 상담에서 원장이 직접 검토하며,
            이 외의 목적에는 사용되지 않습니다.
          </p>
          <p>편안한 마음으로 솔직하게 답해 주세요.</p>
        </div>
        <p className="survey-intro-meta">예상 소요 시간 · 약 10–15분</p>
        <div className="survey-intro-action">
          <Button onClick={() => setStarted(true)} style={{ width: "100%" }}>
            설문 시작하기
          </Button>
        </div>
      </div>
    );
  }

  // ── 완료 화면 ─────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="survey-done">
        <div className="survey-done-icon" aria-hidden="true">✓</div>
        <p className="survey-done-brand">Maison de Balance</p>
        <h2 className="survey-done-title">설문이 안전하게 제출되었습니다.</h2>
        <p className="survey-done-text">
          작성해 주신 내용은 초진 상담에서 원장이 직접 검토합니다.
          <br />
          내원 전 별도로 연락드릴 수 있습니다.
        </p>
        <p className="survey-done-security">
          개인정보는 암호화되어 안전하게 보관됩니다.
        </p>
      </div>
    );
  }

  if (!section) return null;

  // ── 설문 화면 ─────────────────────────────────────────────────

  return (
    <div className="survey-wrap">
      {/* 헤더 */}
      <div className="survey-header">
        <p className="survey-brand">Maison de Balance</p>
        <ProgressBar value={progressPct} chapterLabel={chapter?.name} />
        <div className="survey-gold-line" aria-hidden="true" />
      </div>

      {/* 섹션 */}
      <div className="survey-section">
        {isFemaleSection && (
          <p className="survey-section-context">
            여성 건강과 관련해 몇 가지만 더 여쭙겠습니다.
          </p>
        )}
        <h2 className="survey-section-title">{section.title}</h2>
        {section.intro && (
          <p className="survey-section-intro">{section.intro}</p>
        )}

        {/* 오류 배너 */}
        {hasErrors && (
          <div className="survey-form-error" role="alert">
            필수 항목을 한 번 더 확인해주세요.
          </div>
        )}
        {formError && (
          <div className="survey-form-error" role="alert">
            {formError}
          </div>
        )}

        {/* 문항 */}
        {sectionQuestions.map((q) => (
          <QuestionItem
            key={q.id}
            question={q}
            answers={answers}
            otherTexts={otherTexts}
            error={errors[q.id]}
            onValue={setValue}
            onToggleMulti={toggleMulti}
            onOtherText={(id, text) => setOtherTexts((p) => ({ ...p, [id]: text }))}
          />
        ))}
      </div>

      {/* 하단 sticky 네비게이션 */}
      <nav className="survey-nav" aria-label="설문 탐색">
        <div className="survey-nav-inner">
          {step > 0 ? (
            <Button
              variant="ghost"
              className="survey-nav-back"
              onClick={goBack}
              disabled={submitting}
              aria-label="이전 섹션"
            >
              이전
            </Button>
          ) : (
            <div className="survey-nav-placeholder" />
          )}
          <Button
            variant="primary"
            className="survey-nav-next"
            onClick={goNext}
            disabled={submitting}
          >
            {submitting
              ? "전송 중…"
              : step === visibleSections.length - 1
                ? "제출하기"
                : "다음"}
          </Button>
        </div>
      </nav>
    </div>
  );
}

// ── 문항 컴포넌트 ────────────────────────────────────────────────

function QuestionItem({
  question: q,
  answers,
  otherTexts,
  error,
  onValue,
  onToggleMulti,
  onOtherText,
}: {
  question: SurveyQuestion;
  answers: Answers;
  otherTexts: Record<string, string>;
  error?: string;
  onValue: (id: string, value: AnswerValue) => void;
  onToggleMulti: (id: string, option: string) => void;
  onOtherText: (id: string, text: string) => void;
}) {
  const value = answers[q.id];
  const selected = Array.isArray(value) ? value : [];
  const { text: labelText, unit } = parseLabel(q.label);

  return (
    <div className="survey-q" data-has-error={error ? "true" : "false"}>
      <div className="survey-q-label">
        <span>{labelText}</span>
        {q.required ? (
          <span className="survey-q-req" aria-label="필수 항목" />
        ) : (
          <span className="survey-q-optional">(선택)</span>
        )}
      </div>
      {q.helperText && (
        <p className="survey-q-helper">{q.helperText}</p>
      )}

      <div className="survey-q-body">
        {/* sleep_latency_min — 전용 다이얼 */}
        {q.id === "sleep_latency_min" && (
          <SleepLatencyDial
            value={value}
            onChange={(v) => onValue(q.id, String(v))}
          />
        )}

        {/* short_text */}
        {q.type === "short_text" && (
          <input
            type="text"
            className="ui-input"
            value={typeof value === "string" ? value : ""}
            placeholder={q.placeholder ?? "내 답변"}
            onChange={(e) => onValue(q.id, e.target.value)}
            aria-label={labelText}
            aria-invalid={!!error}
          />
        )}

        {/* number (sleep_latency_min 제외) */}
        {q.type === "number" && q.id !== "sleep_latency_min" && (
          unit ? (
            <div className="survey-number-wrap">
              <input
                type="number"
                inputMode="numeric"
                className="ui-input"
                value={typeof value === "string" ? value : typeof value === "number" ? String(value) : ""}
                placeholder="0"
                onChange={(e) => onValue(q.id, e.target.value)}
                aria-label={labelText}
                aria-invalid={!!error}
                style={{ maxWidth: 160 }}
              />
              <span className="survey-number-unit">{unit}</span>
            </div>
          ) : (
            <input
              type="number"
              inputMode="numeric"
              className="ui-input"
              value={typeof value === "string" ? value : typeof value === "number" ? String(value) : ""}
              placeholder="0"
              onChange={(e) => onValue(q.id, e.target.value)}
              aria-label={labelText}
              aria-invalid={!!error}
              style={{ maxWidth: 200 }}
            />
          )
        )}

        {/* long_text */}
        {q.type === "long_text" && (
          <AutoTextarea
            value={typeof value === "string" ? value : ""}
            placeholder={q.placeholder ?? "내 답변을 자유롭게 적어주세요."}
            onChange={(e) => onValue(q.id, e.target.value)}
            aria-label={labelText}
            aria-invalid={!!error}
          />
        )}

        {/* time */}
        {q.type === "time" && (
          <TimeInput
            value={typeof value === "string" ? value : ""}
            onChange={(v) => onValue(q.id, v)}
            allowNone={q.id === "meal_time_latenight"}
            noneLabel="야식 안 함"
          />
        )}

        {/* yes_no — 동의 카드 */}
        {q.type === "yes_no" && (
          <button
            type="button"
            className={`survey-consent-card${value === "동의합니다" ? " survey-consent-active" : ""}`}
            onClick={() =>
              onValue(q.id, value === "동의합니다" ? "" : "동의합니다")
            }
            aria-pressed={value === "동의합니다"}
          >
            <span
              className="survey-choice-check"
              style={value === "동의합니다"
                ? { borderColor: "var(--color-gold)", background: "var(--color-gold)", color: "var(--color-surface)" }
                : {}}
              aria-hidden="true"
            >
              {value === "동의합니다" ? "✓" : ""}
            </span>
            <span className="survey-consent-text">동의합니다</span>
          </button>
        )}

        {/* single_choice */}
        {q.type === "single_choice" && (
          <div className="survey-choices" role="radiogroup" aria-label={labelText}>
            {q.options?.map((opt) => (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={value === opt}
                className={`survey-choice${value === opt ? " survey-choice-active" : ""}`}
                onClick={() => onValue(q.id, opt)}
              >
                <span className="survey-choice-radio" aria-hidden="true">
                  <span className="survey-choice-radio-dot" />
                </span>
                <span>{opt}</span>
              </button>
            ))}
            {q.allowOther && (
              <div>
                <button
                  type="button"
                  role="radio"
                  aria-checked={value === OTHER}
                  className={`survey-choice${value === OTHER ? " survey-choice-active" : ""}`}
                  onClick={() => onValue(q.id, OTHER)}
                >
                  <span className="survey-choice-radio" aria-hidden="true">
                    <span className="survey-choice-radio-dot" />
                  </span>
                  <span>기타</span>
                </button>
                {value === OTHER && (
                  <div className="survey-other-wrap">
                    <input
                      type="text"
                      className="ui-input"
                      value={otherTexts[q.id] ?? ""}
                      placeholder="직접 입력해주세요."
                      onChange={(e) => onOtherText(q.id, e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* multiple_choice */}
        {q.type === "multiple_choice" && (
          <div className="survey-choices" role="group" aria-label={labelText}>
            {q.options?.map((opt) => (
              <button
                key={opt}
                type="button"
                role="checkbox"
                aria-checked={selected.includes(opt)}
                className={`survey-choice${selected.includes(opt) ? " survey-choice-active" : ""}`}
                onClick={() => onToggleMulti(q.id, opt)}
              >
                <span className="survey-choice-check" aria-hidden="true">
                  {selected.includes(opt) ? "✓" : ""}
                </span>
                <span>{opt}</span>
              </button>
            ))}
            {q.allowOther && (
              <div>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={selected.includes(OTHER)}
                  className={`survey-choice${selected.includes(OTHER) ? " survey-choice-active" : ""}`}
                  onClick={() => onToggleMulti(q.id, OTHER)}
                >
                  <span className="survey-choice-check" aria-hidden="true">
                    {selected.includes(OTHER) ? "✓" : ""}
                  </span>
                  <span>기타</span>
                </button>
                {selected.includes(OTHER) && (
                  <div className="survey-other-wrap">
                    <input
                      type="text"
                      className="ui-input"
                      value={otherTexts[q.id] ?? ""}
                      placeholder="직접 입력해주세요."
                      onChange={(e) => onOtherText(q.id, e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* scale_grid — 모바일 세로 분해 */}
        {q.type === "scale_grid" && (
          <ScaleGrid
            gridRows={q.gridRows ?? []}
            gridCols={q.gridCols ?? []}
            value={
              value && typeof value === "object" && !Array.isArray(value)
                ? (value as Record<string, string>)
                : {}
            }
            onChange={(next) => onValue(q.id, next)}
            labelText={labelText}
          />
        )}
      </div>

      {error && (
        <p className="survey-q-error" role="alert">
          <span aria-hidden="true">·</span> {error}
        </p>
      )}
    </div>
  );
}

// ── 서브 컴포넌트 ────────────────────────────────────────────────

function AutoTextarea({
  value,
  onChange,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <textarea
      className="ui-textarea"
      rows={3}
      value={value}
      onChange={(e) => {
        const el = e.currentTarget;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
        onChange(e);
      }}
      {...props}
    />
  );
}

function TimeInput({
  value,
  onChange,
  allowNone,
  noneLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  allowNone?: boolean;
  noneLabel?: string;
}) {
  const isNone = value === noneLabel;
  return (
    <div>
      {allowNone && (
        <button
          type="button"
          className={`survey-choice${isNone ? " survey-choice-active" : ""}`}
          style={{ marginBottom: 10, width: "auto", padding: "10px 16px" }}
          onClick={() => onChange(isNone ? "" : (noneLabel ?? ""))}
          aria-pressed={isNone}
        >
          <span className="survey-choice-check" aria-hidden="true">
            {isNone ? "✓" : ""}
          </span>
          <span>{noneLabel}</span>
        </button>
      )}
      {!isNone && (
        <div className="survey-time-wrap">
          <input
            type="time"
            className="ui-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label="시간 입력"
            style={{ maxWidth: 200 }}
          />
          {value && (
            <button
              type="button"
              className="survey-time-clear"
              onClick={() => onChange("")}
              aria-label="입력값 지우기"
            >
              ×
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ScaleGrid({
  gridRows,
  gridCols,
  value,
  onChange,
  labelText,
}: {
  gridRows: string[];
  gridCols: string[];
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  labelText: string;
}) {
  return (
    <div className="survey-scale-grid" role="group" aria-label={labelText}>
      {gridRows.map((row) => (
        <div key={row}>
          <p className="survey-scale-row-label">{row}</p>
          <div className="survey-scale-cols" role="radiogroup" aria-label={row}>
            {gridCols.map((col) => (
              <button
                key={col}
                type="button"
                role="radio"
                aria-checked={value[row] === col}
                className={`survey-scale-col-btn${value[row] === col ? " survey-scale-col-active" : ""}`}
                onClick={() => onChange({ ...value, [row]: col })}
              >
                {col}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SleepLatencyDial({
  value,
  onChange,
}: {
  value: AnswerValue;
  onChange: (v: number) => void;
}) {
  const totalMin =
    typeof value === "string" && value !== "" ? parseInt(value, 10) || 0 : 0;
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;

  return (
    <div className="survey-sleep-dial">
      <select
        className="survey-sleep-select"
        value={hrs}
        onChange={(e) => onChange(Number(e.target.value) * 60 + mins)}
        aria-label="시간"
      >
        {[0, 1, 2, 3, 4, 5].map((h) => (
          <option key={h} value={h}>{h}시간</option>
        ))}
      </select>
      <select
        className="survey-sleep-select"
        value={mins}
        onChange={(e) => onChange(hrs * 60 + Number(e.target.value))}
        aria-label="분"
      >
        {[0, 15, 30, 45].map((m) => (
          <option key={m} value={m}>{m}분</option>
        ))}
      </select>
    </div>
  );
}
