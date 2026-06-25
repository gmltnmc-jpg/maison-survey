"use client";

import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
}

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  const varClass = variant === "ghost" ? "ui-btn-ghost" : "ui-btn-primary";
  return (
    <button
      className={`ui-btn ${varClass}${className ? ` ${className}` : ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
