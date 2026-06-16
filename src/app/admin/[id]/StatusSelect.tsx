"use client";

import { useState, useTransition } from "react";
import { updateStatus } from "../actions";
import type { ResponseStatus } from "@/lib/types";

const STATUSES: ResponseStatus[] = [
  "신규 제출",
  "검토 중",
  "상담 예정",
  "상담 완료",
  "보류·취소",
];

export default function StatusSelect({
  responseId,
  current,
}: {
  responseId: string;
  current: ResponseStatus;
}) {
  const [value, setValue] = useState<ResponseStatus>(current);
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as ResponseStatus;
    setValue(next);
    startTransition(() => updateStatus(responseId, next));
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={pending}
      style={{
        border: "1px solid var(--line)",
        borderRadius: 4,
        padding: "6px 10px",
        fontSize: 13,
        background: "var(--paper)",
        color: "var(--ink)",
        cursor: "pointer",
        opacity: pending ? 0.6 : 1,
      }}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
