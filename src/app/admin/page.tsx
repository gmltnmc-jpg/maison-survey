import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { maskPhone } from "@/lib/survey/mask";

const STATUS_COLORS: Record<string, string> = {
  "신규 제출": "#b09a6a",
  "검토 중": "#4a7c59",
  "상담 예정": "#2e5fa3",
  "상담 완료": "#4a4540",
  "보류·취소": "#9c4a35",
};

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();

  const { data: responses, error } = await supabase
    .from("survey_responses")
    .select("id, status, created_at, primary_goal_text, patients(name, rrn_mask, phone)")
    .order("created_at", { ascending: false });

  if (error) {
    return <p style={{ color: "var(--error)" }}>데이터를 불러오지 못했습니다.</p>;
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 500 }}>
          초진 설문 응답 목록
        </h2>
        <p style={{ fontSize: 13, color: "var(--grey)", marginTop: 4 }}>
          총 {responses?.length ?? 0}건
        </p>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--line)", textAlign: "left" }}>
            {["이름", "주민번호", "연락처", "상담 목표", "상태", "제출일"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "10px 12px",
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
          {(responses ?? []).map((row) => {
            const patient = Array.isArray(row.patients) ? row.patients[0] : row.patients;
            return (
              <tr
                key={row.id}
                style={{ borderBottom: "1px solid var(--line)" }}
              >
                <td style={{ padding: "12px 12px" }}>
                  <Link
                    href={`/admin/${row.id}`}
                    style={{
                      color: "var(--ink)",
                      textDecoration: "none",
                      fontWeight: 500,
                    }}
                  >
                    {patient?.name ?? "—"}
                  </Link>
                </td>
                <td style={{ padding: "12px 12px", fontFamily: "monospace", fontSize: 13 }}>
                  {patient?.rrn_mask ?? "—"}
                </td>
                <td style={{ padding: "12px 12px", fontSize: 13 }}>
                  {patient?.phone ? maskPhone(patient.phone) : "—"}
                </td>
                <td
                  style={{
                    padding: "12px 12px",
                    color: "var(--ink-soft)",
                    maxWidth: 260,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.primary_goal_text ?? "—"}
                </td>
                <td style={{ padding: "12px 12px" }}>
                  <span
                    style={{
                      fontSize: 12,
                      padding: "3px 8px",
                      borderRadius: 12,
                      border: `1px solid ${STATUS_COLORS[row.status] ?? "var(--line)"}`,
                      color: STATUS_COLORS[row.status] ?? "var(--grey)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.status}
                  </span>
                </td>
                <td style={{ padding: "12px 12px", fontSize: 13, color: "var(--grey)", whiteSpace: "nowrap" }}>
                  {new Date(row.created_at).toLocaleDateString("ko-KR")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {(responses ?? []).length === 0 && (
        <p style={{ textAlign: "center", color: "var(--grey)", marginTop: 64 }}>
          아직 제출된 설문이 없습니다.
        </p>
      )}
    </div>
  );
}
