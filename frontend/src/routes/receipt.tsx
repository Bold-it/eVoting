import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { VoterStepper } from "@/components/VoterStepper";
import { useVotingState, votingStore } from "@/lib/voting-store";

export const Route = createFileRoute("/receipt")({
  head: () => ({ meta: [{ title: "Receipt — COMPSSA Secure Voting System" }] }),
  component: ReceiptPage,
});

function ReceiptPage() {
  const navigate = useNavigate();
  const state = useVotingState();

  useEffect(() => {
    if (!state.receiptCode) navigate({ to: "/" });
  }, [state.receiptCode, navigate]);

  if (!state.receiptCode) return null;

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <SiteHeader compact />
      <VoterStepper current="receipt" />
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-md">
          <div className="htu-card p-6 text-center sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                className="h-7 w-7 text-success"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-foreground sm:text-2xl">
              Vote submitted successfully
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Thank you for participating in the COMPSSA Elections. Your ballot has been securely recorded.
            </p>

            <div className="mt-6 rounded-md border border-border bg-surface px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Receipt reference
              </p>
              <p className="mt-1 break-all font-mono text-base font-semibold tracking-wide text-foreground">
                {state.receiptCode}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Keep this code as proof of participation. It does not reveal your vote.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                votingStore.reset();
                navigate({ to: "/" });
              }}
              className="mt-6 text-sm font-medium text-primary hover:underline"
            >
              End session
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            COMPSSA Secure Online Voting System · COMPSSA Elections
          </p>
        </div>
      </main>
    </div>
  );
}
