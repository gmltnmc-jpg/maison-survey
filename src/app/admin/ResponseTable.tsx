"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { searchByName, updateResponseStatus } from "./actions";
import type { PatientRow, PatientInfo } from "./actions";
import type { ResponseStatus } from "@/lib/types";
import {
  calcAgeFromRrnMask,
  bmiCategory,
  allowedNextStatus,
  STATUS_BADGE,
  BMI_CHIP,
} from "@/lib/admin/utils";
import { summarizeRiskSeverity } from "@/lib/admin/riskMeta";
import { RiskCountBadge } from "@/components/ui/Badge";

function getPatient(row: PatientRow): PatientInfo | null {
  if (!row.patients) return null;
  return Array.isArray(row.patients) ? row.patients[0] : row.patients;
}

const FALLBACK_BADGE = {
  bg: "var(--color-surface-muted)",
  color: "var(--color-text-muted)",
  border: "var(--color-border)",
};

/**
 * 목록용 즉시 저장 상태 드롭다운.
 * admin_memo는 기존 값 유지, status만 변경.
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
        className="adm-status-select"
        style={{
          backgroundColor: badge.bg,
          color: badge.color,
          borderColor: badge.border,
          opacity: isPending ? 0.6 : 1,
          cursor: isPending ? "wait" : "pointer",
        }}
      >
        {options.map((s) => (
          <option
            key={s}
            value={s}
            style={{ color: "var(--color-text)", background: "var(--color-surface)" }}
          >
            {s}
          </option>
        ))}
      </select>
      {error && (
        <span style={{ fontSize: 10, color: "var(--color-warning-soft)" }}>
          변경에 실패했습니다
        </span>
      )}
    </div>
  );
}

function ResponseRow({ row }: { row: PatientRow }) {
  const router = useRouter();
  const patient = getPatient(row);
  const age = calcAgeFromRrnMask(patient?.rrn_mask);

  const riskFlags = Array.isArray(row.risk_flags) ? row.risk_flags : [];
  const { highCount, mediumCount } = summarizeRiskSeverity(riskFlags);

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
    ? row.primary_goal_text.length > 28
      ? row.primary_goal_text.slice(0, 28) + "…"
      : row.primary_goal_text
    : "—";

  return (
    <tr
      className="adm-row"
      onClick={() => router.push(`/admin/responses/${row.id}`)}
    >
      {/* 상태 드롭다운 클릭 시 행 이동 방지 */}
      <td data-label="상태" onClick={(e) => e.stopPropagation()}>
        <StatusDropdown
          key={`${row.id}-${row.status}`}
          responseId={row.id}
          status={row.status}
          adminMemo={row.admin_memo}
        />
      </td>

      <td data-label="제출일" className="adm-cell-muted adm-cell-nowrap">
        {dateStr}
      </td>

      <td data-label="환자명" style={{ fontWeight: 500 }}>
        {patient?.name ?? "—"}
      </td>

      <td data-label="성별" className="adm-cell-muted">
        {patient?.sex ?? "—"}
      </td>

      <td data-label="나이" className="adm-cell-muted">
        {age != null ? `${age}세` : "—"}
      </td>

      <td
        data-label="상담 목표"
        className="adm-cell-muted"
        style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      >
        {goalText}
      </td>

      <td data-label="BMI">
        {bmi != null && bmiInfo ? (
          <span style={{
            display: "inline-flex",
            padding: "2px 8px",
            borderRadius: "var(--radius-badge)",
            fontSize: 11,
            fontWeight: 600,
            background: BMI_CHIP[bmiInfo.level].bg,
            color: BMI_CHIP[bmiInfo.level].color,
            border: `1px solid ${BMI_CHIP[bmiInfo.level].border}`,
            whiteSpace: "nowrap",
          }}>
            {bmi} ({bmiInfo.label})
          </span>
        ) : (
          <span className="adm-cell-muted">—</span>
        )}
      </td>

      <td data-label="확인 항목" style={{ textAlign: "center" }}>
        {(highCount + mediumCount) > 0 ? (
          <RiskCountBadge highCount={highCount} mediumCount={mediumCount} />
        ) : (
          <span className="adm-cell-muted">—</span>
        )}
      </td>

      <td data-label="메모" style={{ textAlign: "center" }}>
        {row.admin_memo ? (
          <span title="메모 있음" style={{ color: "var(--color-gold)" }}>◆</span>
        ) : (
          <span className="adm-cell-muted">◇</span>
        )}
      </td>

      <td
        className="adm-td-detail"
        onClick={(e) => e.stopPropagation()}
      >
        <Link
          href={`/admin/responses/${row.id}`}
          style={{
            fontSize: 12,
            padding: "4px 10px",
            border: "1px solid var(--color-border)",
            borderRadius: 4,
            color: "var(--color-text)",
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
        if (created < new Date(`${filters.from}T00:00:00`).getTime()) return false;
      }
      if (filters.to) {
        if (created > new Date(`${filters.to}T23:59:59`).getTime()) return false;
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
      {/* 필터 바 */}
      <div className="adm-filters">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => applyFilters({ ...filters, status: undefined })}
            className={`adm-filter-pill${!filters.status ? " adm-filter-pill-active" : ""}`}
          >
            전체
          </button>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleStatus(s)}
              className={`adm-filter-pill${filters.status === s ? " adm-filter-pill-active" : ""}`}
            >
              {s}
            </button>
          ))}

          <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
            {DATE_FILTERS.map(({ label, days }) => {
              const range = getDateRange(days);
              const active = filters.from === range.from && filters.to === range.to;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => applyDateFilter(days)}
                  className={`adm-filter-pill${active ? " adm-filter-pill-active" : ""}`}
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
              className="adm-filter-reset"
            >
              × 초기화
            </button>
          )}
        </div>

        {/* 이름 검색 */}
        <form
          action={searchAction}
          style={{ display: "flex", gap: 6, marginLeft: "auto" }}
        >
          <input
            name="name"
            type="text"
            placeholder="이름 검색"
            className="ui-input"
            style={{ width: 140, height: 36, padding: "0 12px" }}
          />
          <button
            type="submit"
            disabled={isSearching}
            className="ui-btn ui-btn-ghost"
            style={{ padding: "0 14px", height: 36, fontSize: 13 }}
          >
            {isSearching ? "…" : "검색"}
          </button>
          {isSearchActive && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="ui-btn ui-btn-ghost"
              style={{ padding: "0 10px", height: 36, fontSize: 13 }}
            >
              × 해제
            </button>
          )}
        </form>
      </div>

      {(isSearchActive || hasFilters) && (
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 12 }}>
          {isSearchActive ? "이름 검색 결과" : "필터 결과"} — {rows.length}건
        </p>
      )}

      {/* 테이블 */}
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              {TABLE_HEADERS.map((h) => (
                <th key={h}>{h}</th>
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
        <p className="adm-empty">아직 제출된 설문이 없습니다.</p>
      )}
    </>
  );
}
