import Link from "next/link";
import { fetchResponses } from "@/lib/admin/queries";
import ResponseTable from "./ResponseTable";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;

  let rows;
  try {
    rows = await fetchResponses();
  } catch {
    return (
      <div style={{ textAlign: "center", marginTop: 80 }}>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 16 }}>
          응답을 불러오지 못했습니다. 잠시 후 다시 시도하세요.
        </p>
        <Link
          href="/admin"
          style={{
            fontSize: 13,
            padding: "8px 16px",
            border: "1px solid var(--line)",
            borderRadius: 4,
            textDecoration: "none",
            color: "var(--ink)",
          }}
        >
          다시 시도
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 500 }}>
          초진 설문 응답 목록
        </h2>
        <p style={{ fontSize: 13, color: "var(--grey)", marginTop: 4 }}>
          총 {rows.length}건
        </p>
      </div>

      <ResponseTable initialRows={rows} urlParams={params} />
    </div>
  );
}
