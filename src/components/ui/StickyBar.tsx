"use client";

import type { HTMLAttributes } from "react";

type StickyBarProps = HTMLAttributes<HTMLDivElement>;

export function StickyBar({ className, children, ...props }: StickyBarProps) {
  return (
    <div
      className={`ui-sticky-bar${className ? ` ${className}` : ""}`}
      {...props}
    >
      {children}
    </div>
  );
}
