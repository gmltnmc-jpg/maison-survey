"use client";

import { useRef, useEffect, type TextareaHTMLAttributes, type ChangeEvent } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: string;
  error?: string;
  minRows?: number;
}

export function Textarea({
  label,
  helper,
  error,
  id,
  minRows = 3,
  className,
  onChange,
  value,
  ...props
}: TextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    onChange?.(e);
  }

  return (
    <div className="ui-field">
      {label && (
        <label htmlFor={id} className="ui-field-label">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        rows={minRows}
        value={value}
        className={`ui-textarea${error ? " ui-textarea-error" : ""}${className ? ` ${className}` : ""}`}
        onChange={handleChange}
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
