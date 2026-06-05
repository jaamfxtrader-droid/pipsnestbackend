"use client";

import type { ChangeEvent, ReactElement, ReactNode, SelectHTMLAttributes } from "react";
import { Children, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type OptionLike = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  placeholder?: string;
};

function optionFromChild(child: ReactElement): OptionLike | null {
  if (child.type !== "option") return null;
  const props = child.props as { value?: string | number; children?: ReactNode; disabled?: boolean };
  const value = String(props.value ?? "");
  const label = Children.toArray(props.children)
    .map((item) => (typeof item === "string" || typeof item === "number" ? String(item) : ""))
    .join("");
  return { value, label, disabled: props.disabled };
}

export function Select({ className, children, value, defaultValue, onChange, disabled, placeholder = "Select", ...props }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(String(defaultValue ?? ""));
  const ref = useRef<HTMLDivElement | null>(null);
  const selectedValue = value !== undefined ? String(value) : internalValue;

  const options = useMemo(
    () => Children.toArray(children).filter(isValidElement).map(optionFromChild).filter(Boolean) as OptionLike[],
    [children]
  );
  const selected = options.find((option) => option.value === selectedValue);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function choose(option: OptionLike) {
    if (option.disabled || disabled) return;
    setInternalValue(option.value);
    setOpen(false);
    onChange?.({ target: { value: option.value } } as unknown as ChangeEvent<HTMLSelectElement>);
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-slate-300/30 bg-white px-3 text-left text-sm text-slate-950 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-900 dark:text-white",
          props.required && !selected ? "text-slate-400" : ""
        )}
      >
        <span className="min-w-0 truncate">{selected?.label || placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition", open && "rotate-180")} />
      </button>
      {open ? (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-[90] mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-[0_18px_50px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-slate-950"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === selectedValue}
              disabled={option.disabled}
              onClick={() => choose(option)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45",
                option.value === selectedValue
                  ? "bg-primary/10 text-primary dark:bg-primary/15 dark:text-blue-300"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
              )}
            >
              <span className="min-w-0 truncate">{option.label}</span>
              {option.value === selectedValue ? <Check className="h-4 w-4 shrink-0" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
