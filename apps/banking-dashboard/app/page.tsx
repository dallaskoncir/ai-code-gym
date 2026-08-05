import { LedgerTable } from "@fintech-gym/ui-kit";
import { getTransactions } from "../lib/api";

export default async function OverviewPage() {
  const transactions = await getTransactions();

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-slate-900">Recent Transactions</h1>
      <LedgerTable transactions={transactions} />
    </section>
  );
}
