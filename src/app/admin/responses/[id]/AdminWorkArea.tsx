"use client";

import { useActionState, useEffect, useState } from "react";
import { updateResponseStatus } from "../../actions";
import type { UpdateResponseState } from "../../actions";
import type { ResponseStatus } from "@/lib/types";
import { Button } from "@/components/ui/Button";

interface Props {
  responseId: string;
  currentStatus: ResponseStatus;
  currentMemo: string | null;
}

export default function AdminWorkArea({ responseId, currentStatus, currentMemo }: Props) {
  const [state, action, isPending] = useActionState<UpdateResponseState, FormData>(
    updateResponseStatus,
    null,
  );

  const [memo, setMemo] = useState(currentMemo ?? "");
  const isDirty = memo !== (currentMemo ?? "");

  // 페이지 이탈 경고
  useEffect(() => {
    if (!isDirty) return;
    const handle = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handle);
    return () => window.removeEventListener("beforeunload", handle);
  }, [isDirty]);

  return (
    <form action={action} className="adm-work-area">
      {/* status는 메모 저장 시 현재값 유지 */}
      <input type="hidden" name="responseId" value={responseId} />
      <input type="hidden" name="status" value={currentStatus} />

      <div className="adm-work-header">
        <span className="adm-work-admin-tag">관리자 전용</span>
        <span style={{ fontSize: "var(--text-helper)", color: "var(--color-text-subtle)" }}>
          상태 변경은 목록에서 처리합니다
        </span>
      </div>

      {/* 메모 */}
      <div>
        <label htmlFor="work-memo" className="adm-work-field-label">
          관리자 메모
        </label>
        <textarea
          id="work-memo"
          name="adminMemo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={5}
          placeholder="상담 전 확인 사항, 특이 이력 등을 기록하세요."
          className="ui-textarea"
        />
      </div>

      {/* 피드백 */}
      {state?.error && (
        <div className="adm-save-error" role="alert">{state.error}</div>
      )}
      {state?.success && !isDirty && (
        <p className="adm-save-success" role="status">✓ 저장되었습니다</p>
      )}

      <div className="adm-work-actions">
        <Button
          type="submit"
          variant={isDirty ? "primary" : "ghost"}
          disabled={isPending || !isDirty}
        >
          {isPending ? "저장 중…" : "저장하기"}
        </Button>
        {isDirty && (
          <span className="adm-dirty-indicator" aria-live="polite">
            변경됨 · 미저장
          </span>
        )}
      </div>
    </form>
  );
}
