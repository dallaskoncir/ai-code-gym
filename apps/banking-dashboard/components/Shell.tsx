import type { ReactNode } from "react";
import { Header } from "./Header";

export function Shell({ balanceCents, children }: { balanceCents: number; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header balanceCents={balanceCents} />
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
