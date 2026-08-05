import { NavBalanceBadge } from "./NavBalanceBadge";

// `balanceCents` only exists to hand off to NavBalanceBadge two levels
// down — AccountMenu itself never reads it. Every component between the
// layout that fetches the balance and the badge that displays it has to
// know this sensitive value passes through, which is exactly the kind of
// prop-drilling a BalanceContext would avoid.
export function AccountMenu({ balanceCents }: { balanceCents: number }) {
  return (
    <div className="flex items-center gap-3">
      <NavBalanceBadge balanceCents={balanceCents} />
      <div className="h-8 w-8 rounded-full bg-slate-200" aria-hidden="true" />
    </div>
  );
}
