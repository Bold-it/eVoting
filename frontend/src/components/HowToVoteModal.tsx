import { useEffect, useRef } from "react";
import { X, KeyRound, ListChecks, UserCheck, ShieldCheck, Receipt, HelpCircle } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  context?: "login" | "ballot";
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function HowToVoteModal({ open, onClose, context = "login" }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    // Move focus into dialog
    requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const container = dialogRef.current;
      if (!container) return;
      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.hasAttribute("aria-hidden"));
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const steps =
    context === "login"
      ? [
          {
            icon: KeyRound,
            title: "1. Get your credentials",
            body: "Your Electoral Officer issues you two things: your Student ID (e.g. HTU2024001) and a single-use Voting Token (format VOTE-XXXX-XXXX). Keep the token private — it represents your vote.",
          },
          {
            icon: UserCheck,
            title: "2. Log in",
            body: "Enter both fields on the login screen. Both are required. The system will reject the login if the ID and token don't match, or if the token has already been used.",
          },
          {
            icon: ListChecks,
            title: "3. Cast your ballot",
            body: "You'll see one position at a time. Read each candidate's portfolio (manifesto + credentials), then pick one candidate or choose Abstain. You can move back and forth between positions before submitting.",
          },
          {
            icon: ShieldCheck,
            title: "4. Confirm & submit",
            body: "Review every selection on the confirmation screen. Once you submit, your ballot is sealed and cannot be changed.",
          },
          {
            icon: Receipt,
            title: "5. Save your receipt",
            body: "You'll receive a unique receipt code. Save it — it proves your ballot was recorded, but does not reveal who you voted for.",
          },
        ]
      : [
          {
            icon: ListChecks,
            title: "One position at a time",
            body: "Each screen shows the candidates for a single position. Use Next and Back to navigate. Your selections are kept until you submit.",
          },
          {
            icon: UserCheck,
            title: "View a portfolio",
            body: "Click View Portfolio on any candidate card to read their full manifesto and credentials. You can select the candidate directly from the portfolio.",
          },
          {
            icon: HelpCircle,
            title: "Choose or abstain",
            body: "Pick exactly one candidate per position, or select Abstain if you do not wish to vote for that position. Abstentions are counted separately and never as a vote for any candidate.",
          },
          {
            icon: ShieldCheck,
            title: "Confirm before submitting",
            body: "When you reach the last position, you'll be taken to a review screen. You can still go back and change any selection there. Submission is final.",
          },
          {
            icon: Receipt,
            title: "Get your receipt",
            body: "After submitting, save your receipt code. It confirms your participation while keeping your choices secret.",
          },
        ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      aria-hidden="false"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="htv-title"
        aria-describedby="htv-desc"
        className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 bg-primary px-6 py-5 text-primary-foreground">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
              Voter Guide
            </p>
            <h2 id="htv-title" className="mt-1 text-xl font-semibold">
              How to Vote
            </h2>
            <p id="htv-desc" className="mt-1 text-sm text-white/85">
              {context === "login"
                ? "Five quick steps to cast your ballot in the COMPSSA Elections."
                : "Quick reference while you're filling out your ballot."}
            </p>
            <p className="sr-only">
              Press Escape to close. Use Tab to move between actions; focus stays inside this
              dialog.
            </p>
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close How to Vote help dialog"
            className="rounded-md p-1.5 text-white/90 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <ol className="space-y-4">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <li
                  key={s.title}
                  className="flex gap-3 rounded-md border border-border bg-surface px-4 py-3"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                      {s.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-5 rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
            <p className="font-semibold text-primary">Required fields</p>
            <ul className="mt-1.5 list-inside list-disc space-y-1 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Student ID</span> — your official
                HTU student identifier.
              </li>
              <li>
                <span className="font-medium text-foreground">Voting Token</span> — the
                single-use code issued to you (format <span className="font-mono">VOTE-XXXX-XXXX</span>).
              </li>
            </ul>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Need help? Contact your Electoral Officer. Your vote is private and your token can
            only be used once.
          </p>
        </div>

        <div className="flex justify-end border-t border-border bg-surface px-6 py-3">
          <button
            onClick={onClose}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[oklch(0.40_0.17_258)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
