import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchResponseDetail, getFemaleHealthFields } from "@/lib/admin/queries";
import {
  maskPhone,
  calcAgeFromRrnMask,
  bmiCategory,
  calcTargetBmi,
  STATUS_BADGE,
  BMI_CHIP,
} from "@/lib/admin/utils";
import { getRiskSeverity, summarizeRiskSeverity, SEVERITY_LABEL } from "@/lib/admin/riskMeta";
import type { ResponseStatus } from "@/lib/types";
import { Accordion } from "@/components/ui/Accordion";
import { Badge, RiskCountBadge } from "@/components/ui/Badge";
import AdminWorkArea from "./AdminWorkArea";

// ── 상담 전 힌트 ─────────────────────────────────────────────────────────────

const RISK_HINTS: Record<string, string> = {
  cond_cardio:        "식이·운동 처방 전 심혈관 상태 확인 필요",
  cond_diabetes:      "혈당 관리 및 저혈당 위험 사전 안내 필요",
  cond_thyroid:       "갑상선 호르몬이 체중·대사에 미치는 영향 고려",
  cond_kidney:        "단백질 섭취량·수분 권고 기준 조정 필요",
  med_psych:          "수면·식욕에 영향을 주는 약물 복용 중",
  med_steroid:        "스테로이드가 체중·부종에 미치는 영향 확인 필요",
  med_contraceptive:  "호르몬 변화가 체중·식욕에 영향 가능",
  food_allergy:       "식단 설계 시 알레르기 항목 사전 확인 필요",
  sleep_aid:          "수면 보조제 복용 여부가 대사 리듬에 영향",
  sleep_severe:       "수면 부족이 호르몬·식욕 조절에 심각한 영향",
  binge_guilt:        "식이 패턴 및 심리적 접근 병행 검토",
  appetite_drop:      "최근 스트레스·건강 이상 여부 확인 필요",
  urine_dark:         "수분 섭취 부족 또는 신장 기능 이상 가능성",
  urine_foam:         "단백뇨 가능성 — 신장 기능 확인 권고",
  energy_drop:        "최근 컨디션 저하 원인 탐색 필요",
  edema_whole:        "전신 부종 — 내과적 원인 감별 필요",
  target_underweight: "목표 체중이 저체중 기준 미만 — 상담 조정 필요",
};

// ── 서브 컴포넌트 ─────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="adm-field">
      <dt className="adm-field-label">{label}</dt>
      <dd className="adm-field-value">
        {value == null || value === "" ? "—" : value}
      </dd>
    </div>
  );
}

function formatRaw(value: unknown): React.ReactNode {
  if (value == null) return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, v]) => v != null && String(v).trim() !== "",
    );
    if (entries.length === 0) return "—";
    return (
      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {entries.map(([k, v]) => (
          <span key={k}>{k}: {String(v)}</span>
        ))}
      </span>
    );
  }
  const str = String(value).trim();
  return str === "" ? "—" : str;
}

function RawField({ label, answers, field }: { label: string; answers: Record<string, unknown>; field: string }) {
  return <Field label={label} value={formatRaw(answers[field])} />;
}

function MetricCard({
  label,
  value,
  chipLevel,
}: {
  label: string;
  value: string;
  chipLevel?: keyof typeof BMI_CHIP;
}) {
  const chip = chipLevel ? BMI_CHIP[chipLevel] : null;
  return (
    <div
      className="adm-metric-card"
      style={chip ? { background: chip.bg, borderColor: chip.color } : undefined}
    >
      <p className="adm-metric-label">{label}</p>
      <p
        className="adm-metric-value"
        style={chip ? { color: chip.color } : undefined}
      >
        {value}
      </p>
    </div>
  );
}

// ── 페이지 ────────────────────────────────────────────────────────────────────

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
  const targetBmiInfo = targetBmi != null ? bmiCategory(targetBmi) : null;

  const riskFlags = Array.isArray(data.risk_flags)
    ? (data.risk_flags as Array<{ code: string; label: string }>)
    : [];
  const { highCount, mediumCount } = summarizeRiskSeverity(riskFlags);

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
    <div className="adm-detail-wrap">
      <Link href="/admin" className="adm-back-link">← 목록으로</Link>

      {/* ── Sticky 요약 바 ──────────────────────────────────────────── */}
      <div className="adm-sticky-bar">
        <span className="adm-sticky-name">{patient?.name ?? "—"}</span>

        {(patient?.sex || age != null) && (
          <span className="adm-sticky-meta">
            {patient?.sex}{age != null ? ` · ${age}세` : ""}
          </span>
        )}

        <span className="adm-sticky-meta">{maskPhone(patient?.phone)}</span>
        <span className="adm-sticky-meta">{submittedAt} 제출</span>

        <span style={{
          fontSize: 11,
          fontWeight: 600,
          padding: "3px 10px",
          borderRadius: "var(--radius-badge)",
          background: badge.bg,
          color: badge.color,
          border: `1px solid ${badge.border}`,
        }}>
          {data.status}
        </span>

        {bmi != null && bmiInfo && (
          <span style={{
            display: "inline-flex",
            padding: "2px 8px",
            borderRadius: "var(--radius-badge)",
            fontSize: 11,
            fontWeight: 600,
            background: BMI_CHIP[bmiInfo.level].bg,
            color: BMI_CHIP[bmiInfo.level].color,
            border: `1px solid ${BMI_CHIP[bmiInfo.level].border}`,
          }}>
            BMI {bmi} ({bmiInfo.label})
          </span>
        )}

        {(highCount + mediumCount) > 0 && (
          <RiskCountBadge highCount={highCount} mediumCount={mediumCount} />
        )}
      </div>

      {/* ── 섹션 목록 (DASHBOARD_SECTION_ORDER) ─────────────────────── */}
      <div style={{ borderTop: "1px solid var(--color-border)" }}>

        {/* 0. 확인 항목 요약 (특별 섹션, 항상 맨 앞) */}
        <Accordion title="상담 전 확인 항목" defaultOpen>
          {riskFlags.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>확인 항목 없음</p>
          ) : (
            <div className="adm-risk-list">
              {riskFlags.map((flag) => {
                const severity = getRiskSeverity(flag.code);
                const hint = RISK_HINTS[flag.code];
                return (
                  <div key={flag.code} className="adm-risk-item">
                    <Badge variant={severity}>{SEVERITY_LABEL[severity]}</Badge>
                    <div className="adm-risk-text">
                      <span className="adm-risk-label">{flag.label}</span>
                      {hint && <span className="adm-risk-hint">{hint}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Accordion>

        {/* 1. basic — 기본 정보 */}
        <Accordion title="기본 정보">
          <dl>
            <Field label="성별" value={patient?.sex} />
            <Field label="주민등록번호" value={patient?.rrn_mask ?? "—"} />
            <RawField label="출산 경험" answers={answers} field="basic_birth_count" />
            <RawField label="내원 경로" answers={answers} field="basic_referral" />
            <RawField label="소개해 주신 분" answers={answers} field="basic_referrer" />
          </dl>
        </Accordion>

        {/* 2. consent — 개인정보 동의 */}
        <Accordion title="개인정보 동의">
          <dl>
            <RawField label="동의 여부" answers={answers} field="consent_agree" />
          </dl>
        </Accordion>

        {/* 3. goal — 방문 동기와 목표 */}
        <Accordion title="방문 동기와 목표" defaultOpen>
          <dl>
            <Field label="상담 목표" value={data.primary_goal_text} />
            <Field
              label="주요 고민 부위"
              value={data.chief_complaints?.length ? data.chief_complaints.join(", ") : undefined}
            />
          </dl>
        </Accordion>

        {/* 4. body_metrics — 신체 계측 */}
        <Accordion title="신체 계측" defaultOpen>
          <div className="adm-metric-grid">
            <MetricCard label="현재 체중" value={data.current_weight ? `${data.current_weight} kg` : "—"} />
            <MetricCard label="키" value={data.height ? `${data.height} cm` : "—"} />
            <MetricCard
              label="현재 BMI"
              value={bmiInfo ? `${bmi} (${bmiInfo.label})` : "—"}
              chipLevel={bmiInfo?.level}
            />
            <MetricCard label="목표 체중" value={data.target_weight ? `${data.target_weight} kg` : "—"} />
            <MetricCard
              label="목표 BMI"
              value={
                targetBmi != null
                  ? `${targetBmi}${targetBmiInfo?.level === "low" ? " ⚠️ 저체중" : ""}`
                  : "—"
              }
              chipLevel={targetBmiInfo?.level}
            />
          </div>
        </Accordion>

        {/* 5. medical — 건강 이력 */}
        <Accordion title="건강 이력 · 복약 · 알레르기" defaultOpen>
          <dl>
            <Field
              label="확인 항목"
              value={riskFlags.length > 0 ? `${riskFlags.length}개 — 위 '상담 전 확인 항목' 참조` : "해당 없음"}
            />
          </dl>
        </Accordion>

        {/* 6. lifestyle — 생활 패턴 */}
        <Accordion title="생활 패턴">
          <dl>
            <RawField label="직업·주요 생활 패턴" answers={answers} field="life_occupation" />
            <RawField label="규칙적 운동 여부" answers={answers} field="life_exercise" />
            <RawField label="운동 상세" answers={answers} field="life_exercise_detail" />
          </dl>
        </Accordion>

        {/* 7. family — 가족력 */}
        <Accordion title="가족력">
          <dl>
            <RawField label="가족력 여부" answers={answers} field="family_history" />
            <RawField label="가족력 상세" answers={answers} field="family_history_detail" />
          </dl>
        </Accordion>

        {/* 8. female — 여성 건강 리듬 (조건부) */}
        {isFemale && getFemaleHealthFields().length > 0 && (
          <Accordion title="여성 건강 리듬">
            <dl>
              {getFemaleHealthFields().map(({ id, label }) => (
                <RawField key={id} label={label} answers={answers} field={id} />
              ))}
            </dl>
          </Accordion>
        )}

        {/* 9. sleep — 수면 리듬 */}
        <Accordion title="수면 리듬">
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
        </Accordion>

        {/* 10. meal — 식사 리듬 */}
        <Accordion title="식사 리듬">
          <dl>
            <RawField label="식사 규칙성" answers={answers} field="meal_regularity" />
            <RawField label="식사 속도" answers={answers} field="meal_speed" />
            <RawField label="식습관" answers={answers} field="meal_habits" />
            <RawField label="식욕" answers={answers} field="meal_appetite" />
            <RawField label="끼니 거를 때 반응" answers={answers} field="meal_skip_reaction" />
            <RawField label="가장 배고픈 시간" answers={answers} field="meal_hungriest_time" />
          </dl>
        </Accordion>

        {/* 11. alcohol_caffeine — 음주·카페인 */}
        <Accordion title="음주 · 카페인">
          <dl>
            <RawField label="음주 종류" answers={answers} field="alcohol_type" />
            <RawField label="음주량" answers={answers} field="alcohol_amount" />
            <RawField label="주간 음주 횟수" answers={answers} field="alcohol_freq_week" />
            <RawField label="음주 시 식사" answers={answers} field="alcohol_with_meal" />
            <RawField label="카페인(잔/일)" answers={answers} field="caffeine_cups_day" />
            <RawField label="카페인 섭취 시간" answers={answers} field="caffeine_time" />
            <RawField label="카페인 반응" answers={answers} field="caffeine_reaction" />
          </dl>
        </Accordion>

        {/* 12. hydration — 수분 리듬 */}
        <Accordion title="수분 리듬">
          <dl>
            <RawField label="수분 섭취 패턴" answers={answers} field="hydration_pattern" />
          </dl>
        </Accordion>

        {/* 13. body_signal — 몸의 신호 */}
        <Accordion title="몸의 신호">
          <dl>
            <RawField label="체온·에너지" answers={answers} field="signal_temp_energy" />
            <RawField label="땀" answers={answers} field="signal_sweat" />
            <RawField label="부종" answers={answers} field="signal_edema" />
            <RawField label="소화" answers={answers} field="signal_digestion" />
            <RawField label="대변 상태" answers={answers} field="signal_stool" />
            <RawField label="배변 횟수" answers={answers} field="signal_bowel_freq" />
            <RawField label="소변 색" answers={answers} field="urine_color" />
          </dl>
        </Accordion>

        {/* 14. diet_history — 다이어트 이력 */}
        <Accordion title="다이어트 이력">
          <dl>
            <RawField label="다이어트 경험" answers={answers} field="diet_tried" />
            <RawField label="시도해 본 방법" answers={answers} field="diet_methods" />
            <RawField label="잘 된 점·어려웠던 점" answers={answers} field="diet_history_note" />
          </dl>
        </Accordion>

        {/* 15. final — 마지막 질문 */}
        <Accordion title="마지막 질문">
          <dl>
            <RawField label="상담에서 꼭 나누고 싶은 것" answers={answers} field="final_message" />
          </dl>
        </Accordion>

        {/* 관리자 작업 영역 */}
        <Accordion title="관리자 작업 영역">
          <AdminWorkArea
            key={`${data.id}-${data.updated_at}-${data.admin_memo ?? ""}`}
            responseId={data.id}
            currentStatus={data.status as ResponseStatus}
            currentMemo={data.admin_memo}
          />
        </Accordion>
      </div>
    </div>
  );
}
