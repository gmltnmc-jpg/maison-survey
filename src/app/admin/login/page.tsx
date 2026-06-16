"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("이메일 또는 비밀번호를 확인해 주세요.");
      setLoading(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

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

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, color: "var(--ink-soft)" }}>이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{
                border: "1px solid var(--line)",
                borderRadius: 4,
                padding: "10px 12px",
                fontSize: 14,
                background: "var(--paper)",
                color: "var(--ink)",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, color: "var(--ink-soft)" }}>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                border: "1px solid var(--line)",
                borderRadius: 4,
                padding: "10px 12px",
                fontSize: 14,
                background: "var(--paper)",
                color: "var(--ink)",
                outline: "none",
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: "var(--error)" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              background: "var(--ink)",
              color: "var(--paper)",
              border: "none",
              borderRadius: 4,
              padding: "12px",
              fontSize: 14,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "로그인 중…" : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
