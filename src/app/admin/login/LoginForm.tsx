"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "../actions";
import { Button } from "@/components/ui/Button";

export default function LoginForm() {
  const [state, action, isPending] = useActionState<SignInState, FormData>(
    signIn,
    null,
  );

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="ui-field">
        <label htmlFor="email" className="ui-field-label">이메일</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="ui-input"
          aria-describedby={state?.error ? "login-error" : undefined}
        />
      </div>

      <div className="ui-field">
        <label htmlFor="password" className="ui-field-label">비밀번호</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="ui-input"
          aria-describedby={state?.error ? "login-error" : undefined}
        />
      </div>

      {state?.error && (
        <p
          id="login-error"
          role="alert"
          style={{ fontSize: 13, color: "var(--color-warning-soft)" }}
        >
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        style={{ marginTop: 8, width: "100%" }}
      >
        {isPending ? "로그인 중…" : "로그인"}
      </Button>
    </form>
  );
}
