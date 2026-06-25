"use client";

import { useState, type ReactNode } from "react";

interface AccordionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function Accordion({ title, defaultOpen = false, children, className }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`ui-accordion${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        className="ui-accordion-trigger"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{title}</span>
        <span
          className="ui-accordion-chevron"
          data-open={String(open)}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>
      {open && <div className="ui-accordion-content">{children}</div>}
    </div>
  );
}
