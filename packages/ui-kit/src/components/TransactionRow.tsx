export type TransactionStatus = "pending" | "posted" | "failed" | "disputed";

export interface Transaction {
  id: string;
  merchant: string;
  date: string;
  amountCents: number;
  status: TransactionStatus;
}

export interface TransactionRowProps {
  transaction: Transaction;
  onDispute?: (id: string) => void;
}

const STATUS_DOT: Record<TransactionStatus, string> = {
  pending: "bg-amber-400",
  posted: "bg-emerald-500",
  failed: "bg-rose-500",
  disputed: "bg-slate-400",
};

function formatAmount(cents: number): string {
  const dollars = cents / 100;
  const sign = dollars < 0 ? "-" : "";
  return `${sign}$${Math.abs(dollars).toFixed(2)}`;
}

export function TransactionRow({ transaction, onDispute }: TransactionRowProps) {
  const { id, merchant, date, amountCents, status } = transaction;

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          {/* Status is conveyed by color alone — no text alternative for
              screen readers or colorblind users. */}
          <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
          <span className="font-medium text-slate-800">{merchant}</span>
        </div>
      </td>
      <td className="py-3 pr-4 text-slate-500">{date}</td>
      <td className={`py-3 pr-4 text-right font-mono ${amountCents < 0 ? "text-rose-600" : "text-slate-800"}`}>
        {formatAmount(amountCents)}
      </td>
      <td className="py-3 text-right">
        <button
          onClick={() => onDispute?.(id)}
          className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
          </svg>
        </button>
      </td>
    </tr>
  );
}
