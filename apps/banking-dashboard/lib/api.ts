import type { Transaction } from "@fintech-gym/ui-kit";
import type { SendFundsInput } from "./types";

// In-memory mock "backend" — good enough to exercise real async UI seams
// (latency, rejection, optimistic updates) without a real API.
let balanceCents = 482_311;

const transactions: Transaction[] = [
  { id: "txn_1", merchant: "Stripe Payout", date: "2026-08-01", amountCents: 128_400, status: "posted" },
  { id: "txn_2", merchant: "AWS", date: "2026-07-30", amountCents: -18_230, status: "posted" },
  { id: "txn_3", merchant: "Figma", date: "2026-07-29", amountCents: -4_500, status: "posted" },
  { id: "txn_4", merchant: "Wire — Acme Supplies", date: "2026-07-28", amountCents: -92_000, status: "pending" },
  { id: "txn_5", merchant: "Vercel", date: "2026-07-27", amountCents: -2_000, status: "posted" },
];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getBalanceCents(): Promise<number> {
  await delay(150);
  return balanceCents;
}

export async function getTransactions(): Promise<Transaction[]> {
  await delay(250);
  return [...transactions];
}

export async function sendFunds(input: SendFundsInput): Promise<Transaction> {
  await delay(600 + Math.random() * 400);

  if (input.amountCents > balanceCents) {
    // Simulates the server rejecting the transfer (insufficient funds).
    throw new Error("insufficient_funds");
  }

  balanceCents -= input.amountCents;
  const transaction: Transaction = {
    id: `txn_${transactions.length + 1}`,
    merchant: input.recipient,
    date: new Date().toISOString().slice(0, 10),
    amountCents: -input.amountCents,
    status: "posted",
  };
  transactions.unshift(transaction);
  return transaction;
}
