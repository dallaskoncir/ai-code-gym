export function NavBalanceBadge({ balanceCents }: { balanceCents: number }) {
  const formatted = (balanceCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
      {formatted}
    </span>
  );
}
