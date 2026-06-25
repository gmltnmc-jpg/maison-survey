"use client";

interface ProgressBarProps {
  /** 0–100 */
  value: number;
  /** 현재 챕터명 — 숫자 카운트 없이 텍스트만 */
  chapterLabel?: string;
}

export function ProgressBar({ value, chapterLabel }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div className="ui-progress-wrap">
      {chapterLabel && (
        <p className="ui-progress-label" aria-live="polite">
          {chapterLabel}
        </p>
      )}
      <div
        className="ui-progress-track"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={chapterLabel ?? "진행률"}
      >
        <div className="ui-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
