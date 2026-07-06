import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { HowToVoteModal } from "@/components/HowToVoteModal";
import { VoterStepper } from "@/components/VoterStepper";
import { useVotingState, votingStore } from "@/lib/voting-store";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const Route = createFileRoute("/ballot")({
  head: () => ({
    meta: [{ title: "Ballot — COMPSSA Secure Voting System" }],
  }),
  component: BallotPage,
});

function BallotPage() {
  const navigate = useNavigate();
  const state = useVotingState();
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [openPortfolio, setOpenPortfolio] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (!state.accessToken) navigate({ to: "/" });
  }, [state.accessToken, navigate]);

  const { data: election, isLoading, error } = useQuery({
    queryKey: ["voterBallot"],
    queryFn: async () => {
      const res = await api.get("/voter/ballot");
      return res.data;
    },
    enabled: !!state.accessToken,
  });

  if (isLoading) return <div className="p-20 text-center text-white">Loading your secure ballot...</div>;
  if (error || !election) return <div className="p-20 text-center text-red-500">Failed to load ballot. Ensure the election is open.</div>;

  const POSITIONS = election.Positions || [];
  const position = POSITIONS[index];
  const selected = position ? state.selections[position.id] : undefined;
  const total = POSITIONS.length;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  };

  const goNext = () => {
    if (index < total - 1) {
      setIndex(index + 1);
      setOpenPortfolio(null);
      scrollToTop();
    } else {
      navigate({ to: "/confirm" });
    }
  };

  const goBack = () => {
    if (index > 0) {
      setIndex(index - 1);
      setOpenPortfolio(null);
      scrollToTop();
    }
  };

  const stepTransition = reducedMotion ? "" : "transition-colors";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (!position) return <div className="p-20 text-center text-white">No positions configured for this election.</div>;

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <SiteHeader compact />
      <VoterStepper current="ballot" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        
        {/* Dynamic Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {greeting}! 👋
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Welcome to {election.title}. Please make your selections carefully. You cannot change your vote after submitting.
          </p>
        </div>
        {/* Progress */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Position {index + 1} of {total}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {Object.keys(state.selections).length}/{total} selected
              </span>
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                How to Vote
              </button>
            </div>
          </div>
          <div className="flex gap-1.5">
            {POSITIONS.map((p, i) => {
              const done = !!state.selections[p.id];
              const active = i === index;
              return (
                <div
                  key={p.id}
                  className={
                    "h-1.5 flex-1 rounded-full " +
                    stepTransition + " " +
                    (active
                      ? "bg-destructive"
                      : done
                        ? "bg-primary"
                        : "bg-border")
                  }
                />
              );
            })}
          </div>
        </div>

        <div className="htu-card overflow-hidden">
          <div className="border-b border-border bg-accent/40 px-5 py-4 sm:px-6">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">{position.name}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{position.description}</p>
          </div>

          <fieldset className="divide-y divide-border">
            <legend className="sr-only">Select a candidate for {position.name}</legend>

            {position.Candidates && position.Candidates.length === 1 ? (
              // Single Candidate YES/NO UI
              (() => {
                const c = position.Candidates[0];
                return (
                  <div className="divide-y divide-border">
                    {/* Candidate Display */}
                    <div className="flex items-start gap-4 px-5 py-5 sm:px-6 bg-surface/40">
                      {c.photoUrl && (
                        <img
                          src={c.photoUrl}
                          alt=""
                          className="h-14 w-14 shrink-0 rounded-full border border-border bg-surface object-cover sm:h-16 sm:w-16"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-foreground">{c.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Sole Candidate</div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setOpenPortfolio(c.id);
                          }}
                          className="mt-1.5 text-sm font-medium text-primary hover:underline block"
                        >
                          View Portfolio
                        </button>
                      </div>
                    </div>

                    {/* Voting Choices */}
                    <div className="p-5 sm:p-6">
                      <p className="text-sm font-medium text-foreground mb-4">
                        Do you vote YES or NO to approve {c.name} for this position?
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* YES */}
                        <label
                          className={
                            "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors " +
                            (selected === c.id
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border hover:bg-surface/50 text-foreground")
                          }
                        >
                          <input
                            type="radio"
                            name={position.id}
                            value={c.id}
                            checked={selected === c.id}
                            onChange={() => votingStore.setSelection(position.id, c.id)}
                            className="h-4 w-4 shrink-0 accent-[oklch(0.448_0.157_258)]"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm">YES</div>
                            <div className="text-xs text-muted-foreground">Approve candidate</div>
                          </div>
                        </label>

                        {/* NO */}
                        <label
                          className={
                            "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors " +
                            (selected === `NO_${c.id}`
                              ? "border-destructive bg-destructive/5 text-destructive"
                              : "border-border hover:bg-surface/50 text-foreground")
                          }
                        >
                          <input
                            type="radio"
                            name={position.id}
                            value={`NO_${c.id}`}
                            checked={selected === `NO_${c.id}`}
                            onChange={() => votingStore.setSelection(position.id, `NO_${c.id}`)}
                            className="h-4 w-4 shrink-0 accent-destructive"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm">NO</div>
                            <div className="text-xs text-muted-foreground">Reject candidate</div>
                          </div>
                        </label>

                        {/* ABSTAIN */}
                        <label
                          className={
                            "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors " +
                            (selected === "ABSTAIN"
                              ? "border-muted-foreground/50 bg-muted/10 text-foreground"
                              : "border-border hover:bg-surface/50 text-foreground")
                          }
                        >
                          <input
                            type="radio"
                            name={position.id}
                            value="ABSTAIN"
                            checked={selected === "ABSTAIN"}
                            onChange={() => votingStore.setSelection(position.id, "ABSTAIN")}
                            className="h-4 w-4 shrink-0 accent-muted-foreground"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm">Abstain</div>
                            <div className="text-xs text-muted-foreground">Neutral vote</div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              // Multiple Candidates UI (Original)
              <>
                {(position.Candidates || []).map((c) => {
                  const isSelected = selected === c.id;
                  return (
                    <div key={c.id} className={isSelected ? "bg-accent/30" : ""}>
                      <label className="flex cursor-pointer items-start gap-4 px-5 py-4 sm:px-6">
                        <input
                          type="radio"
                          name={position.id}
                          value={c.id}
                          checked={isSelected}
                          onChange={() => votingStore.setSelection(position.id, c.id)}
                          className="mt-1.5 h-5 w-5 shrink-0 accent-[oklch(0.448_0.157_258)]"
                        />
                        {c.photoUrl && (
                          <img
                            src={c.photoUrl}
                            alt=""
                            className="h-14 w-14 shrink-0 rounded-full border border-border bg-surface object-cover sm:h-16 sm:w-16"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-foreground">{c.name}</div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setOpenPortfolio(c.id);
                            }}
                            className="mt-1 text-sm font-medium text-primary hover:underline"
                          >
                            View Portfolio
                          </button>
                        </div>
                      </label>
                    </div>
                  );
                })}

                {/* Abstain option */}
                <label
                  className={
                    "flex cursor-pointer items-center gap-4 px-5 py-4 sm:px-6 " +
                    (selected === "ABSTAIN" ? "bg-accent/30" : "")
                  }
                >
                  <input
                    type="radio"
                    name={position.id}
                    value="ABSTAIN"
                    checked={selected === "ABSTAIN"}
                    onChange={() => votingStore.setSelection(position.id, "ABSTAIN")}
                    className="h-5 w-5 shrink-0 accent-[oklch(0.448_0.157_258)]"
                  />
                  <span className="text-sm text-muted-foreground">
                    Abstain for this position
                  </span>
                </label>
              </>
            )}
          </fieldset>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={index === 0}
            className="rounded-md border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!selected}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-[oklch(0.40_0.17_258)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {index === total - 1 ? "Review Selections" : "Next"}
          </button>
        </div>
      </main>

      <PortfolioModal
        candidate={(position.Candidates || []).find((c) => c.id === openPortfolio) ?? null}
        positionTitle={position.name}
        onClose={() => setOpenPortfolio(null)}
        onSelect={() => {
          if (openPortfolio) votingStore.setSelection(position.id, openPortfolio);
          setOpenPortfolio(null);
        }}
        isSelected={!!openPortfolio && selected === openPortfolio}
      />
      <HowToVoteModal open={helpOpen} onClose={() => setHelpOpen(false)} context="ballot" />
    </div>
  );
}

function PortfolioModal({
  candidate,
  positionTitle,
  onClose,
  onSelect,
  isSelected,
}: {
  candidate: { id: string; name: string; photoUrl: string | null; manifesto: string | null; } | null;
  positionTitle: string;
  onClose: () => void;
  onSelect: () => void;
  isSelected: boolean;
}) {
  useEffect(() => {
    if (!candidate) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [candidate, onClose]);

  if (!candidate) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 px-0 sm:items-center sm:px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="portfolio-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-elevated sm:max-h-[88dvh] sm:rounded-2xl"
      >
        {/* Header — HTU Blue band */}
        <div className="relative bg-primary px-5 py-5 text-primary-foreground sm:px-7 sm:py-6">
          <div className="flex items-start gap-4">
            {candidate.photoUrl && (
              <img
                src={candidate.photoUrl}
                alt=""
                className="h-16 w-16 shrink-0 rounded-full border-2 border-primary-foreground/30 bg-surface object-cover sm:h-20 sm:w-20"
              />
            )}
            <div className="min-w-0 flex-1 pr-8">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/75">
                Candidate for {positionTitle}
              </div>
              <h2 id="portfolio-title" className="mt-0.5 text-xl font-bold leading-tight sm:text-2xl">
                {candidate.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close portfolio"
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-primary-foreground/90 transition-colors hover:bg-primary-foreground/15"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">Manifesto</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground sm:text-base">{candidate.manifesto || "No manifesto provided."}</p>
          </section>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border bg-surface px-5 py-3.5 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onSelect}
            disabled={isSelected}
            className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-[oklch(0.40_0.17_258)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSelected ? "Selected" : "Select Candidate"}
          </button>
        </div>
      </div>
    </div>
  );
}
