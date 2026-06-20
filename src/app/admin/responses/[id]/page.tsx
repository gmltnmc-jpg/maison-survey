import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchResponseDetail, getFemaleHealthFields } from "@/lib/admin/queries";
import {
  maskPhone,
  calcAgeFromRrnMask,
  bmiCategory,
  calcTargetBmi,
  summarizeRiskFlags,
  STATUS_BADGE,
  BMI_COLOR,
} from "@/lib/admin/utils";
import type { ResponseStatus } from "@/lib/types";
import AdminWorkArea from "./AdminWorkArea";

// ── Risk flag hint copy ───────────────────────────────────────────────────────

const RISK_HINTS: Record<string, string> = {
  cond_cardio: "식이·운동 처방 전 심혈관 상태 확인 필요",
  cond_diabetes: "혈당 관리 및 저혈당 위험 사전 안내 필요",
  cond_thyroid: "갑상선 호르몬이 체중·대사에 미치는 영향 고려",
  cond_kidney: "단백질 섭취량·수분 권고 기준 조정 필요",
  med_psych: "수면·식욕에 영향을 주는 약물 복용 중",
  med_steroid: "스테로이드가 체중·부종에 미치는 영향 확인 필요",
  med_contraceptive: "호르몬 변화가 체중·식욕에 영향 가능",
  food_allergy: "식단 설계 시 알레르기 항목 사전 확인 필요",
  sleep_aid: "수면 보조제 복용 여부가 대사 리듬에 영향",
  sleep_severe: "수면 부족이 호르몬·식욕 조절에 심각한 영향",
  binge_guilt: "식이 패턴 및 심리적 접근 병행 검토",
  appetite_drop: "최근 스트레스·건강 이상 여부 확인 필요",
  urine_dark: "수분 섭취 부족 또는 신장 기능 이상 가능성",
  urine_foam: "단백뇨 가능성 — 신장 기능 확인 권고",
  energy_drop: "최근 컨디션 저하 원인 탐색 필요",
  edema_whole: "전신 부종 — 내과적 원인 감별 필요",
  target_underweight: "목표 체중이 저체중 기준 미만 — 상담 조정 필요",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionShell({
  title,
  open = false,
  children,
}: {
  title: string;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={open || undefined}
      style={{
        borderBottom: "1px solid var(--line)",
        marginBottom: 0,
      }}
    >
      <summary
        style={{
          padding: "16px 0",
          cursor: "pointer",
          listStyle: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "var(--serif)",
          fontSize: 15,
          fontWeight: 500,
          color: "var(--ink)",
          userSelect: "none",
        }}
      >
        {title}
        <span style={{ fontSize: 11, color: "var(--grey)", fontFamily: "inherit", fontWeight: 400 }}>
          ▾
        </span>
      </summary>
      <div style={{ paddingBottom: 24 }}>{children}</div>
    </details>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "160px 1fr",
        gap: 12,
        fontSize: 14,
        marginBottom: 10,
      }}
    >
      <dt style={{ color: "var(--grey)", paddingTop: 1 }}>{label}</dt>
      <dd style={{ color: "var(--ink-mid)", lineHeight: 1.7 }}>
        {value == null || value === "" ? "—" : value}
      </dd>
    </div>
  );
}

/**
 * Formats a raw_answers value for display.
 * - array → comma-joined
 * - object → "키: 값" lines
 * - "없음"/numbers/strings → as-is
 * - empty/missing → "—"
 */
function formatRaw(value: unknown): React.ReactNode {
  if (value == null) return "—";
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "—";
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, v]) => v != null && String(v).trim() !== "",
    );
    if (entries.length === 0) return "—";
    return (
      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {entries.map(([k, v]) => (
          <span key={k}>
            {k}: {String(v)}
          </span>
        ))}
      </span>
    );
  }
  const str = String(value).trim();
  return str === "" ? "—" : str;
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 12,
        fontWeight: 500,
        color: "var(--gold-soft)",
        letterSpacing: "0.04em",
        margin: "16px 0 10px",
      }}
    >
      {children}
    </p>
  );
}

/** Field bound to a raw_answers key. */
function RawField({
  label,
  answers,
  field,
}: {
  label: string;
  answers: Record<string, unknown>;
  field: string;
}) {
  return <Field label={label} value={formatRaw(answers[field])} />;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        background: "var(--cream)",
        border: "1px solid var(--line)",
        borderRadius: 6,
      }}
    >
      <p style={{ fontSize: 11, color: "var(--grey)", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 500 }}>{value}</p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ResponseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await fetchResponseDetail(id);
  if (!data) notFound();

  const patient =
    data.patients == null
      ? null
      : Array.isArray(data.patients)
        ? data.patients[0]
        : data.patients;

  const age = calcAgeFromRrnMask(patient?.rrn_mask);
  const bmi = data.bmi;
  const bmiInfo = bmi != null ? bmiCategory(bmi) : null;
  const targetBmi = calcTargetBmi(data.target_weight, data.height);
  const { count: riskCount, items: riskItems } = summarizeRiskFlags(data.risk_flags);
  const badge = STATUS_BADGE[data.status] ?? STATUS_BADGE["보류·취소"];

  const submittedAt = new Date(data.created_at).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const isFemale = patient?.sex === "여성";
  const answers = data.raw_answers ?? {};

  return (
    <div style={{ maxWidth: 820, position: "relative" }}>
      {/* 뒤로 */}
      <Link
        href="/admin"
        style={{ fontSize: 13, color: "var(--grey)", textDecoration: "none" }}
      >
        ← 목록으로
      </Link>

      {/* ── Sticky 요약 바 ──────────────────────────────────────────── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "var(--paper)",
          borderBottom: "1px solid var(--line)",
          padding: "14px 0",
          marginTop: 16,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <span style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 500 }}>
            {patient?.name ?? "—"}
          </span>
          {patient?.sex && (
            <span style={{ fontSize: 13, color: "var(--grey)", marginLeft: 8 }}>
              {patient.sex}
            </span>
          )}
          {age != null && (
            <span style={{ fontSize: 13, color: "var(--grey)", marginLeft: 4 }}>
              {age}세
            </span>
          )}
        </div>

        <div style={{ fontSize: 13, color: "var(--grey)" }}>
          {maskPhone(patient?.phone)}
        </div>

        <div style={{ fontSize: 13, color: "var(--grey)" }}>{submittedAt} 제출</div>

        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            padding: "3px 9px",
            borderRadius: 10,
            background: badge.bg,
            color: badge.color,
            border: `1px solid ${badge.border}`,
          }}
        >
          {data.status}
        </span>

        {bmi != null && bmiInfo && (
          <div style={{ fontSize: 13 }}>
            BMI{" "}
            <span style={{ color: BMI_COLOR[bmiInfo.level], fontWeight: 500 }}>
              {bmi}
            </span>{" "}
            <span style={{ color: "var(--grey)" }}>({bmiInfo.label})</span>
          </div>
        )}
      </div>

      {/* ── Sections ────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid var(--line)" }}>

        {/* 1. 확인 항목 요약 (open) */}
        <SectionShell title="상담 전 확인 항목" open>
          {riskCount === 0 ? (
            <p style={{ fontSize: 14, color: "var(--grey)" }}>확인 항목 없음</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {riskItems.map((label, i) => {
                const flag = data.risk_flags[i];
                const code = typeof flag === "object" ? flag.code : String(i);
                const hint = RISK_HINTS[code];
                return (
                  <div
                    key={code}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "10px 14px",
                      background: "var(--cream)",
                      borderRadius: 6,
                      border: "1px solid var(--line)",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", minWidth: 0 }}>
                      {label}
                    </span>
                    {hint && (
                      <span style={{ fontSize: 12, color: "var(--grey)", lineHeight: 1.5 }}>
                        — {hint}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionShell>

        {/* 2. 방문 동기와 목표 (open) */}
        <SectionShell title="방문 동기와 목표" open>
          <dl>
            {data.primary_goal_text ? (
              <Field label="상담 목표" value={data.primary_goal_text} />
            ) : (
              <Field label="상담 목표" />
            )}
            {data.chief_complaints && data.chief_complaints.length > 0 ? (
              <Field label="주요 고민 부위" value={data.chief_complaints.join(", ")} />
            ) : (
              <Field label="주요 고민 부위" />
            )}
          </dl>
        </SectionShell>

        {/* 3. 신체 계측 */}
        <SectionShell title="신체 계측">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <MetricCard label="현재 체중" value={data.current_weight ? `${data.current_weight} kg` : "—"} />
            <MetricCard label="키" value={data.height ? `${data.height} cm` : "—"} />
            <MetricCard label="현재 BMI" value={bmiInfo ? `${bmi} (${bmiInfo.label})` : "—"} />
            <MetricCard label="목표 체중" value={data.target_weight ? `${data.target_weight} kg` : "—"} />
            <MetricCard
              label="목표 BMI"
              value={
                targetBmi != null
                  ? `${targetBmi}${targetBmi < 18.5 ? " ⚠️ 저체중" : ""}`
                  : "—"
              }
            />
          </div>
        </SectionShell>

        {/* 4. 건강 이력·복약·알레르기 */}
        <SectionShell title="건강 이력 · 복약 · 알레르기">
          <p style={{ fontSize: 13, color: "var(--grey)" }}>
            상세 답변은 확인 항목 요약을 참조하세요.
          </p>
          <dl style={{ marginTop: 12 }}>
            <Field label="질환·복약·알레르기" value={riskCount > 0 ? `${riskCount}개 확인 항목 있음` : "해당 없음"} />
          </dl>
        </SectionShell>

        {/* 5. 가족력 */}
        <SectionShell title="가족력">
          <dl>
            <RawField label="가족력" answers={answers} field="family_history" />
          </dl>
        </SectionShell>

        {/* 6. 여성 건강 (여성만, section === "female" 자동 추출) */}
        {isFemale && getFemaleHealthFields().length > 0 && (
          <SectionShell title="여성 건강 리듬">
            <dl>
              {getFemaleHealthFields().map(({ id, label }) => (
                <RawField key={id} label={label} answers={answers} field={id} />
              ))}
            </dl>
          </SectionShell>
        )}

        {/* 7. 생활 리듬 */}
        <SectionShell title="생활 리듬 (수면 · 식사 · 음주·카페인 · 수분)">
          <SubHeading>수면</SubHeading>
          <dl>
            <RawField label="수면의 질" answers={answers} field="sleep_quality" />
            <RawField label="취침 시 조명" answers={answers} field="sleep_light" />
            <RawField label="잠드는 데 걸리는 시간(분)" answers={answers} field="sleep_latency_min" />
            <RawField label="수면 보조제" answers={answers} field="sleep_aid_use" />
            <RawField label="침실 온도" answers={answers} field="sleep_temp" />
            <RawField label="침실 습도" answers={answers} field="sleep_humidity" />
            <RawField label="침실 TV" answers={answers} field="sleep_bedroom_tv" />
            <RawField label="휴대폰 위치" answers={answers} field="sleep_phone_position" />
            <RawField label="암막 커튼" answers={answers} field="sleep_blackout_curtain" />
          </dl>

          <SubHeading>식사</SubHeading>
          <dl>
            <RawField label="식사 규칙성" answers={answers} field="meal_regularity" />
            <RawField label="식사 속도" answers={answers} field="meal_speed" />
            <RawField label="식습관" answers={answers} field="meal_habits" />
            <RawField label="식욕" answers={answers} field="meal_appetite" />
            <RawField label="끼니 거를 때 반응" answers={answers} field="meal_skip_reaction" />
            <RawField label="가장 배고픈 시간" answers={answers} field="meal_hungriest_time" />
          </dl>

          <SubHeading>음주 · 카페인</SubHeading>
          <dl>
            <RawField label="음주 종류" answers={answers} field="alcohol_type" />
            <RawField label="음주량" answers={answers} field="alcohol_amount" />
            <RawField label="주간 음주 횟수" answers={answers} field="alcohol_freq_week" />
            <RawField label="음주 시 식사" answers={answers} field="alcohol_with_meal" />
            <RawField label="카페인(잔/일)" answers={answers} field="caffeine_cups_day" />
            <RawField label="카페인 섭취 시간" answers={answers} field="caffeine_time" />
            <RawField label="카페인 반응" answers={answers} field="caffeine_reaction" />
          </dl>

          <SubHeading>수분</SubHeading>
          <dl>
            <RawField label="수분 섭취 패턴" answers={answers} field="hydration_pattern" />
          </dl>
        </SectionShell>

        {/* 8. 몸의 신호 */}
        <SectionShell title="몸의 신호">
          <dl>
            <RawField label="체온·에너지" answers={answers} field="signal_temp_energy" />
            <RawField label="땀" answers={answers} field="signal_sweat" />
            <RawField label="부종" answers={answers} field="signal_edema" />
            <RawField label="소화" answers={answers} field="signal_digestion" />
            <RawField label="대변 상태" answers={answers} field="signal_stool" />
            <RawField label="배변 횟수" answers={answers} field="signal_bowel_freq" />
            <RawField label="소변 색" answers={answers} field="urine_color" />
          </dl>
        </SectionShell>

        {/* 9. 다이어트 이력 */}
        <SectionShell title="다이어트 이력">
          <dl>
            <RawField label="다이어트 경험" answers={answers} field="diet_tried" />
            <RawField label="운동 여부" answers={answers} field="life_exercise" />
            <RawField label="직업·활동량" answers={answers} field="life_occupation" />
          </dl>
        </SectionShell>

        {/* 10. 관리자 작업 영역 */}
        <SectionShell title="관리자 작업 영역">
          <AdminWorkArea
            responseId={data.id}
            currentStatus={data.status as ResponseStatus}
            currentMemo={data.admin_memo}
          />
        </SectionShell>
      </div>
    </div>
  );
}
