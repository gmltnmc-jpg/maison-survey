import { signOut } from "./actions";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <header
        style={{
          borderBottom: "1px solid var(--line)",
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--paper)",
        }}
      >
        <div>
          <div className="brand" style={{ marginBottom: 2 }}>
            Maison de Balance
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>관리자 대시보드</div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            style={{
              background: "none",
              border: "1px solid var(--line)",
              borderRadius: 4,
              padding: "6px 14px",
              fontSize: 13,
              color: "var(--ink-soft)",
              cursor: "pointer",
            }}
          >
            로그아웃
          </button>
        </form>
      </header>
      <main style={{ padding: "32px" }}>{children}</main>
    </div>
  );
}
