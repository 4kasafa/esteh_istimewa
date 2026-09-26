import { useLayoutEffect, useRef } from "react";
import { cleanRupiahInput, formatRupiahNumber } from "../../utils/formatters";

function cursorPosForDigits(formatted, digitsCount) {
  if (digitsCount <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) seen += 1;
    if (seen === digitsCount) return i + 1;
  }
  return formatted.length;
}

export default function RupiahInput({
  value,
  onChange,
  onValueChange,
  showPrefix = true,
  id,
  name,
  disabled = false,
  required = false,
  placeholder = "",
  className = "",
  ...rest
}) {
  const inputRef = useRef(null);
  const pendingCursorRef = useRef(null);

  const plain = cleanRupiahInput(value ?? "");
  const display = formatRupiahNumber(plain);

  useLayoutEffect(() => {
    if (pendingCursorRef.current !== null && inputRef.current) {
      try {
        inputRef.current.setSelectionRange(
          pendingCursorRef.current,
          pendingCursorRef.current
        );
      } catch {
        // ponytail: abaikan jika input hidden/disabled.
      }
      pendingCursorRef.current = null;
    }
  }, [display]);

  const emit = (nextPlain, originalEvent) => {
    const numericVal = nextPlain === "" ? "" : Number(nextPlain);
    if (onValueChange) onValueChange(nextPlain, numericVal);
    if (onChange) {
      if (originalEvent) {
        onChange({
          ...originalEvent,
          target: {
            ...originalEvent.target,
            value: nextPlain,
            name: name ?? originalEvent.target?.name,
          },
        });
      } else {
        onChange({ target: { value: nextPlain, name } });
      }
    }
  };

  const handleChange = (e) => {
    const el = e.target;
    const raw = el.value;
    const cursor = el.selectionStart ?? raw.length;
    const digitsBefore = cleanRupiahInput(raw.slice(0, cursor)).length;
    const nextPlain = cleanRupiahInput(raw);
    pendingCursorRef.current = cursorPosForDigits(
      formatRupiahNumber(nextPlain),
      digitsBefore
    );
    emit(nextPlain, e);
  };

  const handleKeyDown = (e) => {
    if (e.key !== "Backspace") return;
    const el = e.currentTarget;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    if (start !== end) return;
    // ponytail: jika kursor tepat setelah titik, hapus digit sebelum titik.
    if (start > 0 && display[start - 1] === ".") {
      e.preventDefault();
      const digitsBefore = cleanRupiahInput(display.slice(0, start)).length;
      const idxToDelete = digitsBefore - 1;
      if (idxToDelete < 0) return;
      const nextPlain = plain.slice(0, idxToDelete) + plain.slice(idxToDelete + 1);
      pendingCursorRef.current = cursorPosForDigits(
        formatRupiahNumber(nextPlain),
        digitsBefore - 1
      );
      emit(nextPlain, e);
    }
  };

  const baseInputStyle =
    "w-full rounded-2xl border border-brand-green/15 bg-white px-4 py-3 text-sm font-bold text-brand-green-dark focus:outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all placeholder:text-brand-muted/30 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="relative w-full">
      {showPrefix && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-brand-green-dark/50"
        >
          Rp
        </span>
      )}
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        aria-label={rest["aria-label"] ?? placeholder ?? "Nominal Rupiah"}
        value={display}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={`${baseInputStyle} ${showPrefix ? "pl-11" : ""} ${className}`.trim()}
        {...rest}
      />
    </div>
  );
}
