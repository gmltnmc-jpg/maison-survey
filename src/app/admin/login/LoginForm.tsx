"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "../actions";

export default function LoginForm() {
  const [state, action, isPending] = useActionState<SignInState, FormData>(
    signIn,
    null,
  );

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label htmlFor="email" style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
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
        <label htmlFor="password" style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
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

      {state?.error && (
        <p style={{ fontSize: 13, color: "var(--error)" }}>{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        style={{
          marginTop: 8,
          background: "var(--ink)",
          color: "var(--paper)",
          border: "none",
          borderRadius: 4,
          padding: "12px",
          fontSize: 14,
          cursor: isPending ? "not-allowed" : "pointer",
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? "로그인 중…" : "로그인"}
      </button>
    </form>
  );
}
