"use client";

import { useState, type FormEvent } from "react";
import { CurrencyInput, type Transaction } from "@fintech-gym/ui-kit";
import { sendFunds } from "../lib/api";

type OptimisticSend = Transaction & { optimistic?: boolean };

let sendCounter = 0;

export function SendFundsForm() {
  const [recipient, setRecipient] = useState("");
  const [amountCents, setAmountCents] = useState(0);
  const [memo, setMemo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sends, setSends] = useState<OptimisticSend[]>([]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Guarding on `isSubmitting` reads whatever value was captured in this
    // render's closure. Two rapid clicks (double-click, or a slow click
    // handler re-registering before React re-renders) can both read `false`
    // here and both proceed — `setIsSubmitting(true)` doesn't take effect
    // until the next render, so it can't block a submit that's already in
    // flight. A ref-based lock wouldn't have this gap.
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    const optimisticId = `optimistic_${++sendCounter}`;
    const optimisticEntry: OptimisticSend = {
      id: optimisticId,
      merchant: recipient,
      date: new Date().toISOString().slice(0, 10),
      amountCents: -amountCents,
      status: "pending",
      optimistic: true,
    };
    setSends((prev) => [optimisticEntry, ...prev]);

    try {
      const confirmed = await sendFunds({ recipient, amountCents, memo });
      setSends((prev) => prev.map((send) => (send.id === optimisticId ? confirmed : send)));
      setRecipient("");
      setAmountCents(0);
      setMemo("");
    } catch (err) {
      // The optimistic "pending" entry is left in `sends` — the API
      // rejected the transfer (e.g. insufficient funds), but the UI still
      // shows it as if it's in flight, so the user believes money is on
      // its way when the transfer never happened.
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Recipient
          <input
            type="text"
            required
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Acme Supplies"
          />
        </label>

        <CurrencyInput label="Amount" valueCents={amountCents} onChangeCents={setAmountCents} />

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Memo (optional)
          <input
            type="text"
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {isSubmitting ? "Sending…" : "Send Funds"}
        </button>
      </form>

      {sends.length > 0 ? (
        <ul className="flex flex-col gap-2 text-sm">
          {sends.map((send) => (
            <li key={send.id} className="flex items-center justify-between rounded-md bg-white px-4 py-2 shadow-sm">
              <span>{send.merchant}</span>
              <span className="text-slate-500">{send.status}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
