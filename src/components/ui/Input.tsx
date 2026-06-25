"use client";

import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
}

export function Input({ label, helper, error, id, className, ...props }: InputProps) {
  return (
    <div className="ui-field">
      {label && (
        <label htmlFor={id} className="ui-field-label">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`ui-input${error ? " ui-input-error" : ""}${className ? ` ${className}` : ""}`}
        {...props}
      />
      {helper && !error && <p className="ui-field-helper">{helper}</p>}
      {error && (
        <p className="ui-field-error" role="alert">
          <span aria-hidden="true">·</span> {error}
        </p>
      )}
    </div>
  );
}
