import Link from "next/link";
import { AccountMenu } from "./AccountMenu";

export function Header({ balanceCents }: { balanceCents: number }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
        <Link href="/" className="text-slate-900">
          Overview
        </Link>
        <Link href="/send">Send Funds</Link>
      </nav>
      <AccountMenu balanceCents={balanceCents} />
    </header>
  );
}
