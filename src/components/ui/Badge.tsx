"use client";

import type { ReactNode } from "react";

export type BadgeVariant = "success" | "info" | "subtle" | "high" | "medium" | "low";

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  success: "ui-badge-success",
  info:    "ui-badge-info",
  subtle:  "ui-badge-subtle",
  high:    "ui-badge-high",
  medium:  "ui-badge-medium",
  low:     "ui-badge-low",
};

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span className={`ui-badge ${VARIANT_CLASS[variant]}${className ? ` ${className}` : ""}`}>
      {children}
    </span>
  );
}

/** status 문자열 → badge variant */
export function statusBadgeVariant(status: string): BadgeVariant {
  if (status === "상담 완료") return "success";
  if (status === "보류·취소") return "subtle";
  return "info";
}

/** severity 문자열 → badge variant (없으면 medium 폴백) */
export function severityBadgeVariant(severity?: string | null): "high" | "medium" | "low" {
  if (severity === "high" || severity === "medium" || severity === "low") return severity;
  return "medium";
}

/** 관리자 목록 — high+medium 합산 개수 badge */
interface RiskCountBadgeProps {
  highCount: number;
  mediumCount: number;
}

export function RiskCountBadge({ highCount, mediumCount }: RiskCountBadgeProps) {
  const count = highCount + mediumCount;
  if (count === 0) return null;
  return (
    <Badge variant={highCount > 0 ? "high" : "medium"}>{count}</Badge>
  );
}
