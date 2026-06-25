"use client";

import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div className={`ui-card${className ? ` ${className}` : ""}`} {...props}>
      {children}
    </div>
  );
}
