import type { Metadata } from "next";
import { Shell } from "../components/Shell";
import { getBalanceCents } from "../lib/api";
import "@fintech-gym/ui-kit/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meridian — Banking Dashboard",
  description: "Practice fintech dashboard for AI Code Gym review-mode exercises.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const balanceCents = await getBalanceCents();

  return (
    <html lang="en">
      <body className="font-sans text-slate-900 antialiased">
        <Shell balanceCents={balanceCents}>{children}</Shell>
      </body>
    </html>
  );
}
