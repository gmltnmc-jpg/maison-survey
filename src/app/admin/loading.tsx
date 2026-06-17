const SKELETON_COLS = [80, 100, 60, 40, 40, 180, 60, 40, 30, 50];

function SkeletonRow() {
  return (
    <tr style={{ borderBottom: "1px solid var(--line)" }}>
      {SKELETON_COLS.map((w, i) => (
        <td key={i} style={{ padding: "12px 10px" }}>
          <div
            style={{
              height: 14,
              width: w,
              borderRadius: 4,
              background: "var(--line)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        </td>
      ))}
    </tr>
  );
}

export default function AdminLoading() {
  return (
    <div style={{ maxWidth: 1200 }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div style={{ marginBottom: 20 }}>
        <div style={{ height: 22, width: 160, borderRadius: 4, background: "var(--line)" }} />
        <div style={{ height: 14, width: 60, borderRadius: 4, background: "var(--line)", marginTop: 8 }} />
      </div>

      <div style={{ height: 36, marginBottom: 16, display: "flex", gap: 8 }}>
        {[80, 80, 80, 80, 80].map((w, i) => (
          <div key={i} style={{ height: 28, width: w, borderRadius: 10, background: "var(--line)" }} />
        ))}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--line)", background: "var(--cream)" }}>
            {["상태", "제출일", "환자명", "성별", "나이", "상담 목표", "BMI", "확인 항목", "메모", "상세"].map((h) => (
              <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 500, fontSize: 13, color: "var(--ink-soft)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </tbody>
      </table>
    </div>
  );
}
