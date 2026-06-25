import { signOut } from "./actions";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="adm-wrap">
      <header className="adm-header">
        <div>
          <p className="adm-header-brand">Maison de Balance</p>
          <p className="adm-header-sub">관리자 대시보드</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="ui-btn ui-btn-ghost"
            style={{ padding: "6px 16px", fontSize: 13 }}
          >
            로그아웃
          </button>
        </form>
      </header>
      <main className="adm-main">{children}</main>
    </div>
  );
}
