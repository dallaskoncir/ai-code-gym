import { memo } from "react";
import { TransactionRow, type Transaction } from "./TransactionRow.js";

export interface LedgerTableProps {
  transactions: Transaction[];
  onSelectTransaction?: (id: string) => void;
}

// Memoized so unchanged rows should skip re-rendering when the ledger
// updates — see the bug in LedgerTable below.
const MemoTransactionRow = memo(TransactionRow);

function sumCents(transactions: Transaction[]): number {
  return transactions.reduce((sum, tx) => sum + tx.amountCents, 0);
}

export function LedgerTable({ transactions, onSelectTransaction }: LedgerTableProps) {
  const balanceCents = sumCents(transactions);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="py-2 pl-4">Merchant</th>
            <th className="py-2">Date</th>
            <th className="py-2 pr-4 text-right">Amount</th>
            <th className="py-2 pr-4" />
          </tr>
        </thead>
        <tbody className="px-4">
          {transactions.map((transaction) => (
            // A new arrow function is created on every LedgerTable render
            // and passed as `onDispute`, so MemoTransactionRow's props are
            // never referentially equal — memo() never actually skips a
            // re-render, no matter how many unrelated rows change.
            <MemoTransactionRow
              key={transaction.id}
              transaction={transaction}
              onDispute={() => onSelectTransaction?.(transaction.id)}
            />
          ))}
        </tbody>
      </table>
      <div className="flex justify-between border-t border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
        <span>Balance</span>
        <span className="font-mono">{(balanceCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
      </div>
    </div>
  );
}
