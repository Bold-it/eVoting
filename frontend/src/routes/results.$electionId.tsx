import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { Trophy, RefreshCcw } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { useAdminState } from "@/lib/admin-store";
import { electionTurnout, processBackendResults, type PositionResult } from "@/lib/results";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const Route = createFileRoute("/results/$electionId")({
  head: () => ({
    meta: [{ title: "Election Results — COMPSSA Secure Voting System" }],
  }),
  component: PublicResultsPage,
});

function PublicResultsPage() {
  const { electionId } = Route.useParams();
  const { data: election } = useQuery({
    queryKey: ["publicElection", electionId],
    queryFn: async () => {
      const res = await api.get(`/public/elections/${electionId}`);
      return res.data;
    },
    enabled: !!electionId,
  });

  useEffect(() => {
    if (!election || (election.status !== "Results Published" && election.status !== "results_published")) {
      // If results aren't yet public, send the user home.
      // (Admins can preview from the tally screen.)
      // Comment this out if you want to allow direct viewing for demo.
    }
  }, [election, navigate]);

  const { data: backendData, isLoading, error } = useQuery({
    queryKey: ["publicElectionResults", electionId],
    queryFn: async () => {
      const res = await api.get(`/public/elections/${electionId}/results`);
      return res.data;
    },
    enabled: !!election && (election.status === "Results Published" || election.status === "results_published"),
  });

  const results = useMemo(() => {
    if (!election || !backendData) return [];
    return processBackendResults(backendData, election);
  }, [election, backendData]);

  if (!election) {
    return (
      <div className="flex min-h-dvh flex-col bg-surface">
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
          <p className="text-center text-muted-foreground">Election not found.</p>
        </main>
      </div>
    );
  }

  const turnout = electionTurnout(election);
  const notPublished = election.status !== "Results Published" && election.status !== "results_published";

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {notPublished && (
          <div className="mb-6 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
            Preview — these results have not been officially published yet.
          </div>
        )}

        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Official Results</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">{election.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{election.description}</p>

          <div className="mx-auto mt-5 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-border bg-background px-4 py-2 text-sm">
            <span className="font-semibold tabular-nums text-foreground">{turnout.voted.toLocaleString()}</span>
            <span className="text-muted-foreground">of</span>
            <span className="font-semibold tabular-nums text-foreground">{turnout.total.toLocaleString()}</span>
            <span className="text-muted-foreground">eligible voters participated —</span>
            <span className="font-semibold text-primary">{turnout.pct}% turnout</span>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          {isLoading && (
            <div className="w-full rounded-md border border-border bg-surface p-8 text-center text-muted-foreground">
              Loading official results...
            </div>
          )}
          {error && (
            <div className="w-full rounded-md border border-destructive bg-destructive/10 p-8 text-center text-destructive">
              Failed to load official results. Please try again later.
            </div>
          )}
          {!isLoading && !error && results.map((r) => (
            <PublicPositionCard key={r.position.id} result={r} />
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-5 text-center text-xs text-muted-foreground">
          Ho Technical University · COMPSSA Elections ·{" "}
          <Link to="/" className="font-medium text-primary hover:underline">Return home</Link>
        </div>
      </main>
    </div>
  );
}

function PublicPositionCard({ result }: { result: PositionResult }) {
  const { position, tallies, validVotes, outcome } = result;
  const isRunoffResolved = false; // visual flag if this position had been to runoff
  const winnerIds =
    outcome.kind === "decided"
      ? [outcome.winners[0]?.candidate.id]
      : outcome.kind === "no_majority" && outcome.nextStep === "plurality"
        ? [tallies[0]?.candidate.id]
        : [];
  const winner = tallies.find((t) => winnerIds.includes(t.candidate.id));

  return (
    <div className="htu-card overflow-hidden">
      <div className="border-b border-border bg-surface/60 px-5 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{position.title}</p>
        {isRunoffResolved && (
          <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
            <RefreshCcw className="h-3 w-3" /> Decided by runoff
          </p>
        )}
      </div>

      {winner ? (
        <div className="flex flex-col gap-4 border-b border-border bg-primary/5 px-5 py-5 sm:flex-row sm:items-center">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary text-xl font-bold text-primary-foreground sm:h-20 sm:w-20">
            {winner.candidate.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
          </div>
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
              <Trophy className="h-3 w-3" /> Winner
            </span>
            <h3 className="mt-1.5 text-xl font-bold text-foreground sm:text-2xl">{winner.candidate.name}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              <span className="font-semibold tabular-nums text-foreground">{winner.votes.toLocaleString()}</span>{" "}
              votes · {winner.pct.toFixed(1)}% of valid ballots
            </p>
          </div>
        </div>
      ) : (
        <div className="border-b border-border bg-amber-500/10 px-5 py-3 text-sm font-medium text-amber-800">
          Awaiting runoff
        </div>
      )}

      <ul className="divide-y divide-border">
        {tallies
          .filter((t) => !winnerIds.includes(t.candidate.id))
          .map((t) => (
            <li key={t.candidate.id} className="px-5 py-3">
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="truncate text-sm text-foreground">{t.candidate.name}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {t.votes.toLocaleString()} · {t.pct.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div className="h-full bg-primary/50" style={{ width: t.pct + "%" }} />
              </div>
            </li>
          ))}
      </ul>

      <div className="flex items-center justify-between bg-surface/40 px-5 py-2.5 text-[11px] text-muted-foreground">
        <span>Total valid votes: {validVotes.toLocaleString()}</span>
        <span>Abstentions: {result.abstain.toLocaleString()}</span>
      </div>
    </div>
  );
}
