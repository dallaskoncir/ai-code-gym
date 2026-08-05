import { useState, type ChangeEvent, type FocusEvent } from "react";

export interface CurrencyInputProps {
  /** Current amount in integer cents — the source of truth passed back up. */
  valueCents: number;
  onChangeCents: (cents: number) => void;
  currency?: string;
  label?: string;
  disabled?: boolean;
}

function centsToDisplay(cents: number, currency: string): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency,
  });
}

export function CurrencyInput({
  valueCents,
  onChangeCents,
  currency = "USD",
  label = "Amount",
  disabled = false,
}: CurrencyInputProps) {
  const [draft, setDraft] = useState(() => (valueCents / 100).toFixed(2));

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value;
    setDraft(raw);

    const parsed = Number.parseFloat(raw);
    if (Number.isNaN(parsed)) return;

    // Convert dollars to integer cents for the caller. Floating-point
    // multiplication (e.g. 19.99 * 100 === 1998.9999999999998) means
    // flooring here silently truncates a cent off certain amounts.
    onChangeCents(Math.floor(parsed * 100));
  }

  function handleBlur(_event: FocusEvent<HTMLInputElement>) {
    setDraft((valueCents / 100).toFixed(2));
  }

  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      {label}
      <span className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500">
        <span className="text-slate-400">{currency === "USD" ? "$" : currency}</span>
        <input
          type="text"
          inputMode="decimal"
          className="w-full bg-transparent outline-none disabled:text-slate-400"
          value={draft}
          disabled={disabled}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-label={label}
        />
      </span>
      <span className="text-xs text-slate-400">{centsToDisplay(valueCents, currency)}</span>
    </label>
  );
}
