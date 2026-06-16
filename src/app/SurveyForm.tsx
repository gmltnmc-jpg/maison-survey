"use client";

import { useMemo, useState } from "react";
import { SECTIONS } from "@/lib/survey/sections";
import { QUESTIONS } from "@/lib/survey/questions";
import { isQuestionVisible, isSectionVisible } from "@/lib/survey/conditions";
import { validateSection } from "@/lib/survey/validation";
import type { Answers, AnswerValue, SurveyQuestion } from "@/lib/survey/types";

const OTHER = "__other__";

type ErrorMap = Record<string, string>;

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
        err instanceof Error ? err.message : "전송 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!started) {
    return (
      <div className="cover">
        <div className="brand">Maison de Balance</div>
        <h1 className="cover-title">
          몸의 균형을
          <br />
          다시 <em>설계</em>하다
        </h1>
        <div className="cover-intro">
          <p>
            우리는 체중만 보지 않습니다. 수면, 식사, 장내환경, 호르몬 리듬, 운동, 수분과
            미네랄 균형까지 함께 살핍니다.
          </p>
          <p>편안한 마음으로 솔직하게 답해 주세요. 작성하신 내용은 맞춤 관리에만 사용됩니다.</p>
        </div>
        <button className="btn-next cover-start" onClick={() => setStarted(true)}>
          설문 시작하기
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="done">
        <div className="brand">Maison de Balance</div>
        <h2 className="done-title">
          감사합니다.
          <br />
          선생님의 리듬을 살펴보겠습니다.
        </h2>
        <p className="done-text">
          작성해 주신 내용은 초진 상담에서 원장이 직접 검토합니다.
        </p>
      </div>
    );
  }

  if (!section) return null;

  return (
    <div className="wrap">
      <div className="brand">Maison de Balance</div>
      <div className="sec-no">No. {section.no}</div>
      <h2 className="sec-title">{section.title}</h2>
      {section.intro && <p className="sec-intro">{section.intro}</p>}
      <div className="progress">
        {step + 1} / {visibleSections.length}
      </div>

      {sectionQuestions.map((q) => (
        <Question
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

      {formError && <div className="form-error">{formError}</div>}

      <div className="nav">
        {step > 0 && (
          <button className="btn-back" onClick={() => setStep(step - 1)} disabled={submitting}>
            이전
          </button>
        )}
        <button className="btn-next" onClick={goNext} disabled={submitting}>
          {submitting
            ? "전송 중…"
            : step === visibleSections.length - 1
              ? "제출하기"
              : "다음"}
        </button>
      </div>
    </div>
  );
}

function Question({
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

  return (
    <div className="q">
      <div className="q-label">
        {q.label}
        {q.required && <span className="q-req">*</span>}
      </div>
      {q.helperText && <div className="q-help">{q.helperText}</div>}
      <div className="q-body">
        {(q.type === "short_text" || q.type === "number" || q.type === "time") && (
          <input
            type={q.type === "number" ? "number" : q.type === "time" ? "time" : "text"}
            value={typeof value === "string" ? value : ""}
            placeholder="내 답변"
            onChange={(e) => onValue(q.id, e.target.value)}
          />
        )}

        {q.type === "long_text" && (
          <textarea
            value={typeof value === "string" ? value : ""}
            placeholder="내 답변"
            onChange={(e) => onValue(q.id, e.target.value)}
          />
        )}

        {q.type === "yes_no" && (
          <label className="opt">
            <input
              type="checkbox"
              checked={value === "동의합니다"}
              onChange={(e) => onValue(q.id, e.target.checked ? "동의합니다" : "")}
            />
            <span>동의합니다</span>
          </label>
        )}

        {q.type === "single_choice" && (
          <>
            {q.options?.map((opt) => (
              <label className="opt" key={opt}>
                <input
                  type="radio"
                  name={q.id}
                  checked={value === opt}
                  onChange={() => onValue(q.id, opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
            {q.allowOther && (
              <label className="opt">
                <input
                  type="radio"
                  name={q.id}
                  checked={value === OTHER}
                  onChange={() => onValue(q.id, OTHER)}
                />
                <span>기타:</span>
                <input
                  type="text"
                  className="other-input"
                  value={otherTexts[q.id] ?? ""}
                  onFocus={() => onValue(q.id, OTHER)}
                  onChange={(e) => onOtherText(q.id, e.target.value)}
                />
              </label>
            )}
          </>
        )}

        {q.type === "multiple_choice" && (
          <>
            {q.options?.map((opt) => (
              <label className="opt" key={opt}>
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => onToggleMulti(q.id, opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
            {q.allowOther && (
              <label className="opt">
                <input
                  type="checkbox"
                  checked={selected.includes(OTHER)}
                  onChange={() => onToggleMulti(q.id, OTHER)}
                />
                <span>기타:</span>
                <input
                  type="text"
                  className="other-input"
                  value={otherTexts[q.id] ?? ""}
                  onChange={(e) => onOtherText(q.id, e.target.value)}
                />
              </label>
            )}
          </>
        )}

        {q.type === "scale_grid" && (
          <table className="grid">
            <thead>
              <tr>
                <th />
                {q.gridCols?.map((c) => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {q.gridRows?.map((row) => {
                const gridVal =
                  value && typeof value === "object" && !Array.isArray(value)
                    ? (value as Record<string, string>)
                    : {};
                return (
                  <tr key={row}>
                    <td>{row}</td>
                    {q.gridCols?.map((col) => (
                      <td key={col}>
                        <input
                          type="radio"
                          name={`${q.id}__${row}`}
                          checked={gridVal[row] === col}
                          onChange={() => onValue(q.id, { ...gridVal, [row]: col })}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {error && <div className="q-err">{error}</div>}
    </div>
  );
}
