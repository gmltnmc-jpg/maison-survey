"use client";

import { useActionState } from "react";
import Link from "next/link";
import { searchByName } from "./actions";
import type { PatientRow, PatientInfo } from "./actions";
import type { ResponseStatus } from "@/lib/types";
import {
  calcAgeFromRrnMask,
  bmiCategory,
  summarizeRiskFlags,
  STATUS_BADGE,
  BMI_COLOR,
} from "@/lib/admin/utils";

function getPatient(row: PatientRow): PatientInfo | null {
  if (!row.patients) return null;
  return Array.isArray(row.patients) ? row.patients[0] : row.patients;
}

function StatusBadge({ status }: { status: ResponseStatus }) {
  const s = STATUS_BADGE[status] ?? {
    bg: "#F9FAFB",
    color: "#6B7280",
    border: "#E5E7EB",
  };
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11,
        fontWeight: 500,
        padding: "3px 8px",
        borderRadius: 10,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

function ResponseRow({ row }: { row: PatientRow }) {
  const patient = getPatient(row);
  const age = calcAgeFromRrnMask(patient?.rrn_mask);
  const { count: riskCount } = summarizeRiskFlags(row.risk_flags);
  const bmi = row.bmi;
  const bmiInfo = bmi != null ? bmiCategory(bmi) : null;

  const dateStr = new Date(row.created_at).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const goalText = row.primary_goal_text
    ? row.primary_goal_text.length > 30
      ? row.primary_goal_text.slice(0, 30) + "…"
      : row.primary_goal_text
    : "—";

  return (
    <tr style={{ borderBottom: "1px solid var(--line)" }}>
      <td style={{ padding: "10px 10px" }}>
        <StatusBadge status={row.status} />
      </td>
      <td style={{ padding: "10px 10px", fontSize: 12, color: "var(--grey)", whiteSpace: "nowrap" }}>
        {dateStr}
      </td>
      <td style={{ padding: "10px 10px", fontWeight: 500 }}>
        {patient?.name ?? "—"}
      </td>
      <td style={{ padding: "10px 10px", fontSize: 13, color: "var(--ink-soft)" }}>
        {patient?.sex ?? "—"}
      </td>
      <td style={{ padding: "10px 10px", fontSize: 13, color: "var(--ink-soft)" }}>
        {age != null ? `${age}세` : "—"}
      </td>
      <td
        style={{
          padding: "10px 10px",
          fontSize: 13,
          color: "var(--ink-soft)",
          maxWidth: 200,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {goalText}
      </td>
      <td style={{ padding: "10px 10px", fontSize: 13 }}>
        {bmi != null && bmiInfo ? (
          <span style={{ color: BMI_COLOR[bmiInfo.level], fontWeight: 500 }}>
            {bmi} <span style={{ fontSize: 11, fontWeight: 400 }}>({bmiInfo.label})</span>
          </span>
        ) : (
          <span style={{ color: "var(--grey)" }}>—</span>
        )}
      </td>
      <td style={{ padding: "10px 10px", textAlign: "center" }}>
        {riskCount > 0 ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#FEE2E2",
              color: "#DC2626",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {riskCount}
          </span>
        ) : (
          <span style={{ color: "var(--grey)", fontSize: 12 }}>—</span>
        )}
      </td>
      <td style={{ padding: "10px 10px", textAlign: "center", fontSize: 14 }}>
        {row.admin_memo ? (
          <span title="메모 있음" style={{ color: "#D97706" }}>◆</span>
        ) : (
          <span style={{ color: "var(--grey)" }}>◇</span>
        )}
      </td>
      <td style={{ padding: "10px 10px" }}>
        <Link
          href={`/admin/responses/${row.id}`}
          style={{
            fontSize: 12,
            padding: "4px 10px",
            border: "1px solid var(--line)",
            borderRadius: 4,
            color: "var(--ink)",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          상세 →
        </Link>
      </td>
    </tr>
  );
}

const TABLE_HEADERS = [
  "상태", "제출일", "환자명", "성별", "나이",
  "상담 목표", "BMI", "확인 항목", "메모", "상세",
];

interface Props {
  initialRows: PatientRow[];
  urlParams: { status?: string; from?: string; to?: string };
}

export default function ResponseTable({ initialRows, urlParams }: Props) {
  const [searchState, searchAction, isSearching] = useActionState<
    { results: PatientRow[] } | null,
    FormData
  >(searchByName, null);

  const rows = searchState !== null ? searchState.results : initialRows;
  const isSearchActive = searchState !== null;

  return (
    <>
      {/* 필터 (GET form — URL 파라미터) */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <form method="GET" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["신규 제출", "검토 중", "상담 예정", "상담 완료", "보류·취소"] as ResponseStatus[]).map(
            (s) => (
              <a
                key={s}
                href={`/admin?status=${encodeURIComponent(s)}`}
                style={{
                  fontSize: 12,
                  padding: "4px 10px",
                  borderRadius: 10,
                  textDecoration: "none",
                  ...(urlParams.status === s
                    ? { background: "var(--ink)", color: "var(--paper)" }
                    : { background: "var(--cream)", color: "var(--ink-soft)", border: "1px solid var(--line)" }),
                }}
              >
                {s}
              </a>
            ),
          )}
          {urlParams.status && (
            <a
              href="/admin"
              style={{ fontSize: 12, color: "var(--grey)", alignSelf: "center", textDecoration: "none" }}
            >
              × 초기화
            </a>
          )}

          <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
            {[
              { label: "오늘", days: 0 },
              { label: "7일", days: 7 },
              { label: "30일", days: 30 },
            ].map(({ label, days }) => {
              const from = new Date();
              from.setDate(from.getDate() - days);
              const fromStr = from.toISOString().split("T")[0];
              const today = new Date().toISOString().split("T")[0];
              const active = urlParams.from === fromStr && urlParams.to === today;
              return (
                <a
                  key={label}
                  href={`/admin?from=${fromStr}&to=${today}${urlParams.status ? `&status=${encodeURIComponent(urlParams.status)}` : ""}`}
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 10,
                    textDecoration: "none",
                    ...(active
                      ? { background: "var(--ink)", color: "var(--paper)" }
                      : { background: "var(--cream)", color: "var(--ink-soft)", border: "1px solid var(--line)" }),
                  }}
                >
                  {label}
                </a>
              );
            })}
          </div>
        </form>

        {/* 이름 검색 (서버 액션 — URL 미노출) */}
        <form
          action={searchAction}
          style={{ display: "flex", gap: 6, marginLeft: "auto" }}
        >
          <input
            name="name"
            type="text"
            placeholder="이름 검색"
            style={{
              border: "1px solid var(--line)",
              borderRadius: 4,
              padding: "5px 10px",
              fontSize: 13,
              background: "var(--paper)",
              color: "var(--ink)",
              width: 140,
            }}
          />
          <button
            type="submit"
            disabled={isSearching}
            style={{
              border: "1px solid var(--line)",
              borderRadius: 4,
              padding: "5px 12px",
              fontSize: 13,
              background: "var(--paper)",
              cursor: isSearching ? "not-allowed" : "pointer",
              opacity: isSearching ? 0.6 : 1,
            }}
          >
            {isSearching ? "…" : "검색"}
          </button>
          {isSearchActive && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                border: "1px solid var(--line)",
                borderRadius: 4,
                padding: "5px 10px",
                fontSize: 13,
                background: "var(--paper)",
                cursor: "pointer",
                color: "var(--grey)",
              }}
            >
              × 검색 해제
            </button>
          )}
        </form>
      </div>

      {isSearchActive && (
        <p style={{ fontSize: 12, color: "var(--grey)", marginBottom: 12 }}>
          이름 검색 결과 {rows.length}건
        </p>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--line)", textAlign: "left", background: "var(--cream)" }}>
              {TABLE_HEADERS.map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "8px 10px",
                    fontWeight: 500,
                    color: "var(--ink-soft)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <ResponseRow key={row.id} row={row} />
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <p style={{ textAlign: "center", color: "var(--grey)", marginTop: 64, fontSize: 14 }}>
          아직 제출된 설문이 없습니다.
        </p>
      )}
    </>
  );
}
