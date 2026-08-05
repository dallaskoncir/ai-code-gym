import { SendFundsForm } from "../../components/SendFundsForm";

export default function SendFundsPage() {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-slate-900">Send Funds</h1>
      <SendFundsForm />
    </section>
  );
}
