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
    <div className="adm-login-wrap">
      <div className="adm-login-card">
        <p className="adm-login-brand">Maison de Balance</p>
        <h1 className="adm-login-title">관리자 로그인</h1>
        {notice && (
          <p className="adm-login-notice" role="alert">{notice}</p>
        )}
        <LoginForm />
      </div>
    </div>
  );
}
