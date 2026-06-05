"use client";

import { useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

type OtpCodeInputProps = {
  length: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

export function OtpCodeInput({ length, value, onChange, disabled, className }: OtpCodeInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = useMemo(() => Array.from({ length }, (_, index) => value[index] ?? ""), [length, value]);

  function updateValue(index: number, rawValue: string) {
    const nextDigits = [...digits];
    const cleanValue = rawValue.replace(/\D/g, "");

    if (cleanValue.length > 1) {
      const pastedDigits = cleanValue.slice(0, length).split("");
      onChange(pastedDigits.join(""));
      inputsRef.current[Math.min(pastedDigits.length, length) - 1]?.focus();
      return;
    }

    nextDigits[index] = cleanValue;
    onChange(nextDigits.join("").slice(0, length));
    if (cleanValue && index < length - 1) inputsRef.current[index + 1]?.focus();
  }

  return (
    <div className={cn("grid gap-2", className)} style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            inputsRef.current[index] = node;
          }}
          value={digit}
          onChange={(event) => updateValue(index, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digits[index] && index > 0) inputsRef.current[index - 1]?.focus();
          }}
          onPaste={(event) => {
            event.preventDefault();
            updateValue(index, event.clipboardData.getData("text"));
          }}
          disabled={disabled}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          aria-label={`OTP digit ${index + 1}`}
          className="h-12 rounded-md border border-slate-300/40 bg-white text-center text-lg font-bold text-slate-950 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/10 dark:text-white"
        />
      ))}
    </div>
  );
}
