"use client";

import { useActionState, useEffect, useState } from "react";
import { updateResponseStatus } from "../../actions";
import type { UpdateResponseState } from "../../actions";
import type { ResponseStatus } from "@/lib/types";

interface Props {
  responseId: string;
  currentStatus: ResponseStatus;
  currentMemo: string | null;
}

export default function AdminWorkArea({
  responseId,
  currentStatus,
  currentMemo,
}: Props) {
  const [state, action, isPending] = useActionState<UpdateResponseState, FormData>(
    updateResponseStatus,
    null,
  );

  const [memo, setMemo] = useState(currentMemo ?? "");
  const [isDirty, setIsDirty] = useState(false);


  // Warn on navigate away when unsaved
  useEffect(() => {
    if (!isDirty) return;
    const handle = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handle);
    return () => window.removeEventListener("beforeunload", handle);
  }, [isDirty]);

  return (
    <div>
      <form action={action} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <input type="hidden" name="responseId" value={responseId} />
        {/* 상태는 목록에서 변경한다. 메모 저장 시 기존 상태를 유지하기 위해 함께 전송. */}
        <input type="hidden" name="status" value={currentStatus} />

        {/* Memo */}
        <div>
          <label style={{ display: "block", fontSize: 13, color: "var(--grey)", marginBottom: 6 }}>
            관리자 메모
          </label>
          <textarea
            name="adminMemo"
            value={memo}
            onChange={(e) => {
              setMemo(e.target.value);
              setIsDirty(true);
            }}
            rows={5}
            placeholder="상담 전 확인 사항, 특이 이력 등을 기록하세요."
            style={{
              width: "100%",
              border: "1px solid var(--line)",
              borderRadius: 4,
              padding: "10px 12px",
              fontSize: 13,
              background: "var(--paper)",
              color: "var(--ink)",
              resize: "vertical",
              lineHeight: 1.6,
              boxSizing: "border-box",
            }}
          />
        </div>

        {state?.error && (
          <p style={{ fontSize: 13, color: "var(--error)" }}>{state.error}</p>
        )}
        {state?.success && !isDirty && (
          <p style={{ fontSize: 13, color: "#059669" }}>저장되었습니다.</p>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="submit"
            disabled={isPending || !isDirty}
            style={{
              padding: "9px 20px",
              background: isDirty ? "var(--ink)" : "var(--line)",
              color: isDirty ? "var(--paper)" : "var(--grey)",
              border: "none",
              borderRadius: 4,
              fontSize: 13,
              cursor: isPending || !isDirty ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {isPending ? "저장 중…" : "메모 저장"}
          </button>
          {isDirty && (
            <span style={{ fontSize: 12, color: "var(--grey)" }}>미저장 변경사항이 있습니다</span>
          )}
        </div>
      </form>
    </div>
  );
}
