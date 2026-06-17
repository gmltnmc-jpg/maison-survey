import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string; unauthorized?: string }>;
}) {
  const params = await searchParams;
  const notice =
    params.expired === "1"
      ? "세션이 만료되어 다시 로그인이 필요합니다"
      : params.unauthorized === "1"
        ? "접근 권한이 없습니다"
        : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--cream)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "var(--paper)",
          border: "1px solid var(--line)",
          borderRadius: 8,
          padding: "48px 40px",
          width: "100%",
          maxWidth: 400,
        }}
      >
        <div className="brand" style={{ marginBottom: 4 }}>
          Maison de Balance
        </div>
        <h1
          style={{
            fontFamily: "var(--serif)",
            fontSize: 22,
            fontWeight: 500,
            marginBottom: 32,
          }}
        >
          관리자 로그인
        </h1>

        {notice && (
          <p
            style={{
              fontSize: 13,
              color: "var(--error)",
              marginBottom: 20,
              padding: "10px 12px",
              background: "var(--cream)",
              border: "1px solid var(--line)",
              borderRadius: 4,
            }}
          >
            {notice}
          </p>
        )}

        <LoginForm />
      </div>
    </div>
  );
}
