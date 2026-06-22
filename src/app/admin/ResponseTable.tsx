"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { searchByName, updateResponseStatus } from "./actions";
import type { PatientRow, PatientInfo } from "./actions";
import type { ResponseStatus } from "@/lib/types";
import {
  calcAgeFromRrnMask,
  bmiCategory,
  summarizeRiskFlags,
  allowedNextStatus,
  STATUS_BADGE,
  BMI_COLOR,
} from "@/lib/admin/utils";

function getPatient(row: PatientRow): PatientInfo | null {
  if (!row.patients) return null;
  return Array.isArray(row.patients) ? row.patients[0] : row.patients;
}

const FALLBACK_BADGE = { bg: "#F9FAFB", color: "#6B7280", border: "#E5E7EB" };

/**
 * Inline status selector. Changing the value calls updateResponseStatus
 * immediately (no save button). admin_memo is preserved by passing the row's
 * existing memo. On failure the value reverts and an inline error is shown.
 */
function StatusDropdown({
  responseId,
  status,
  adminMemo,
}: {
  responseId: string;
  status: ResponseStatus;
  adminMemo: string | null;
}) {
  const [value, setValue] = useState<ResponseStatus>(status);
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();


  // Current status is always selectable; allowedNextStatus never includes it.
  const options: ResponseStatus[] = [status, ...allowedNextStatus(status)];
  const badge = STATUS_BADGE[value] ?? FALLBACK_BADGE;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as ResponseStatus;
    const prev = value;
    setValue(next);
    setError(false);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("responseId", responseId);
      fd.set("status", next);
      fd.set("adminMemo", adminMemo ?? "");
      const res = await updateResponseStatus(null, fd);
      if (res?.error) {
        setValue(prev);
        setError(true);
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <select
        value={value}
        onChange={handleChange}
        disabled={isPending}
        style={{
          fontSize: 11,
          fontWeight: 500,
          padding: "3px 8px",
          borderRadius: 10,
          background: badge.bg,
          color: badge.color,
          border: `1px solid ${badge.border}`,
          cursor: isPending ? "wait" : "pointer",
          opacity: isPending ? 0.6 : 1,
          appearance: "none",
          WebkitAppearance: "none",
          whiteSpace: "nowrap",
        }}
      >
        {options.map((s) => (
          <option key={s} value={s} style={{ color: "var(--ink)", background: "var(--paper)" }}>
            {s}
          </option>
        ))}
      </select>
      {error && (
        <span style={{ fontSize: 10, color: "var(--error)" }}>상태 변경에 실패했습니다</span>
      )}
    </div>
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
        <StatusDropdown
          key={`${row.id}-${row.status}`}
          responseId={row.id}
          status={row.status}
          adminMemo={row.admin_memo}
        />
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

const STATUS_FILTERS: ResponseStatus[] = [
  "신규 제출",
  "상담 예정",
  "상담 완료",
  "보류·취소",
];

const DATE_FILTERS = [
  { label: "오늘", days: 0 },
  { label: "7일", days: 7 },
  { label: "30일", days: 30 },
] as const;

type Filters = {
  status?: ResponseStatus;
  from?: string;
  to?: string;
};

function normalizeStatus(status?: string): ResponseStatus | undefined {
  return STATUS_FILTERS.includes(status as ResponseStatus)
    ? (status as ResponseStatus)
    : undefined;
}

function getDateRange(days: number): { from: string; to: string } {
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    from: from.toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  };
}

function syncUrl(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const query = params.toString();
  window.history.pushState(null, "", query ? `/admin?${query}` : "/admin");
}

function filterRows(rows: PatientRow[], filters: Filters): PatientRow[] {
  return rows.filter((row) => {
    if (filters.status && row.status !== filters.status) return false;

    if (filters.from || filters.to) {
      const created = new Date(row.created_at).getTime();
      if (filters.from) {
        const from = new Date(`${filters.from}T00:00:00`).getTime();
        if (created < from) return false;
      }
      if (filters.to) {
        const to = new Date(`${filters.to}T23:59:59`).getTime();
        if (created > to) return false;
      }
    }

    return true;
  });
}

interface Props {
  initialRows: PatientRow[];
  urlParams: { status?: string; from?: string; to?: string };
}

export default function ResponseTable({ initialRows, urlParams }: Props) {
  const [searchState, searchAction, isSearching] = useActionState<
    { results: PatientRow[] } | null,
    FormData
  >(searchByName, null);
  const [filters, setFilters] = useState<Filters>({
    status: normalizeStatus(urlParams.status),
    from: urlParams.from,
    to: urlParams.to,
  });

  const filteredRows = filterRows(initialRows, filters);
  const rows = searchState !== null ? searchState.results : filteredRows;
  const isSearchActive = searchState !== null;
  const hasFilters = Boolean(filters.status || filters.from || filters.to);

  function applyFilters(next: Filters) {
    setFilters(next);
    syncUrl(next);
  }

  function toggleStatus(status: ResponseStatus) {
    applyFilters({
      ...filters,
      status: filters.status === status ? undefined : status,
    });
  }

  function applyDateFilter(days: number) {
    const range = getDateRange(days);
    const active = filters.from === range.from && filters.to === range.to;
    applyFilters({
      ...filters,
      from: active ? undefined : range.from,
      to: active ? undefined : range.to,
    });
  }

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {STATUS_FILTERS.map((s) => {
            const active = filters.status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleStatus(s)}
                style={{
                  fontSize: 12,
                  padding: "4px 10px",
                  borderRadius: 10,
                  border: active ? "1px solid var(--ink)" : "1px solid var(--line)",
                  cursor: "pointer",
                  ...(active
                    ? { background: "var(--ink)", color: "var(--paper)" }
                    : { background: "var(--cream)", color: "var(--ink-soft)" }),
                }}
              >
                {s}
              </button>
            );
          })}

          <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
            {DATE_FILTERS.map(({ label, days }) => {
              const range = getDateRange(days);
              const active = filters.from === range.from && filters.to === range.to;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => applyDateFilter(days)}
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 10,
                    border: active ? "1px solid var(--ink)" : "1px solid var(--line)",
                    cursor: "pointer",
                    ...(active
                      ? { background: "var(--ink)", color: "var(--paper)" }
                      : { background: "var(--cream)", color: "var(--ink-soft)" }),
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={() => applyFilters({})}
              style={{
                border: "none",
                background: "transparent",
                fontSize: 12,
                color: "var(--grey)",
                cursor: "pointer",
                alignSelf: "center",
              }}
            >
              × 초기화
            </button>
          )}
        </div>

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

      {(isSearchActive || hasFilters) && (
        <p style={{ fontSize: 12, color: "var(--grey)", marginBottom: 12 }}>
          {isSearchActive ? "이름 검색 결과" : "필터 결과"} {rows.length}건
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
