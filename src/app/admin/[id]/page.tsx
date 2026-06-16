import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { QUESTIONS } from "@/lib/survey/questions";
import { DASHBOARD_SECTION_ORDER, SECTION_BY_CODE } from "@/lib/survey/sections";
import { maskPhone } from "@/lib/survey/mask";
import type { RiskFlag } from "@/lib/survey/riskFlags";
import type { ResponseStatus } from "@/lib/types";
import type { AnswerValue } from "@/lib/survey/types";
import StatusSelect from "./StatusSelect";

function formatValue(value: AnswerValue): string {
  if (value == null) return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" / ");
  }
  return String(value) || "—";
}

export default async function ResponseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("survey_responses")
    .select("*, patients(*)")
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  const patient = Array.isArray(data.patients) ? data.patients[0] : data.patients;
  const answers = (data.raw_answers ?? {}) as Record<string, AnswerValue>;
  const riskFlags = (data.risk_flags ?? []) as RiskFlag[];

  return (
    <div style={{ maxWidth: 820 }}>
      {/* 뒤로 */}
      <Link
        href="/admin"
        style={{ fontSize: 13, color: "var(--grey)", textDecoration: "none" }}
      >
        ← 목록으로
      </Link>

      {/* 헤더 */}
      <div
        style={{
          marginTop: 20,
          marginBottom: 32,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 500 }}>
            {patient?.name ?? "—"}
          </h2>
          <p style={{ fontSize: 13, color: "var(--grey)", marginTop: 4 }}>
            {patient?.rrn_mask ?? "—"} &nbsp;·&nbsp;{" "}
            {patient?.phone ? maskPhone(patient.phone) : "—"} &nbsp;·&nbsp;{" "}
            {new Date(data.created_at).toLocaleDateString("ko-KR")} 제출
          </p>
        </div>
        <StatusSelect responseId={data.id} current={data.status as ResponseStatus} />
      </div>

      {/* 리스크 플래그 */}
      {riskFlags.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--error)",
              marginBottom: 8,
            }}
          >
            상담 주의 플래그
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {riskFlags.map((f) => (
              <span
                key={f.code}
                style={{
                  fontSize: 12,
                  padding: "4px 10px",
                  borderRadius: 12,
                  border: "1px solid var(--error)",
                  color: "var(--error)",
                }}
              >
                {f.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 주요 지표 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 12,
          marginBottom: 40,
          padding: 20,
          background: "var(--cream)",
          borderRadius: 6,
          border: "1px solid var(--line)",
        }}
      >
        {[
          { label: "현재 체중", value: data.current_weight ? `${data.current_weight} kg` : "—" },
          { label: "키", value: data.height ? `${data.height} cm` : "—" },
          { label: "목표 체중", value: data.target_weight ? `${data.target_weight} kg` : "—" },
          { label: "BMI", value: data.bmi ?? "—" },
        ].map(({ label, value }) => (
          <div key={label}>
            <p style={{ fontSize: 11, color: "var(--grey)", marginBottom: 2 }}>{label}</p>
            <p style={{ fontSize: 16, fontWeight: 500 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* 목표 */}
      {data.primary_goal_text && (
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, color: "var(--grey)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            상담 목표
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--ink-mid)" }}>
            {data.primary_goal_text}
          </p>
        </div>
      )}

      {/* 섹션별 답변 */}
      {DASHBOARD_SECTION_ORDER.map((sectionCode) => {
        const sectionMeta = SECTION_BY_CODE[sectionCode];
        const sectionQuestions = QUESTIONS.filter(
          (q) => q.section === sectionCode && q.dashboard && q.id !== "basic_rrn",
        );
        if (sectionQuestions.length === 0) return null;

        const hasAnyAnswer = sectionQuestions.some((q) => answers[q.id] != null);
        if (!hasAnyAnswer) return null;

        return (
          <div key={sectionCode} style={{ marginBottom: 36 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                borderBottom: "1px solid var(--line)",
                paddingBottom: 8,
                marginBottom: 16,
              }}
            >
              <span style={{ fontStyle: "italic", color: "var(--gold-soft)", fontSize: 18 }}>
                {sectionMeta.no}
              </span>
              <span style={{ fontFamily: "var(--serif)", fontSize: 16, fontWeight: 500 }}>
                {sectionMeta.title}
              </span>
            </div>

            <dl style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sectionQuestions.map((q) => {
                const val = answers[q.id];
                if (val == null) return null;
                return (
                  <div
                    key={q.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "200px 1fr",
                      gap: 12,
                      fontSize: 14,
                    }}
                  >
                    <dt style={{ color: "var(--grey)", paddingTop: 1 }}>{q.label}</dt>
                    <dd style={{ color: "var(--ink-mid)", lineHeight: 1.7 }}>
                      {formatValue(val)}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        );
      })}
    </div>
  );
}
