export type { Transaction, TransactionStatus } from "@fintech-gym/ui-kit";

export interface SendFundsInput {
  recipient: string;
  amountCents: number;
  memo?: string;
}
