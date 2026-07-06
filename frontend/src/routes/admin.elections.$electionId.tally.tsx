import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ShieldCheck, AlertTriangle, AlertOctagon, Trophy } from "lucide-react";
import { AdminShell, PrimaryButton, SecondaryButton, StatusBadge } from "@/components/admin/AdminShell";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { isPositionPublishable, electionTurnout, processBackendResults, type PositionResult } from "@/lib/results";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useElection } from "@/lib/queries";

export const Route = createFileRoute("/admin/elections/$electionId/tally")({
  head: () => ({ meta: [{ title: "Tally Review — HTU Admin" }] }),
  component: TallyPage,
});

function TallyPage() {
  const { electionId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: election, isLoading: electionLoading } = useElection(electionId);
  const [confirmPublish, setConfirmPublish] = useState(false);

  const { data: backendData, isLoading, error } = useQuery({
    queryKey: ["electionResults", electionId],
    queryFn: async () => {
      const res = await api.get(`/admin/elections/${electionId}/results`);
      return res.data;
    },
    enabled: !!election,
  });

  const { mutateAsync: publishResults, isPending: isPublishing } = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/admin/elections/${electionId}`, { status: 'results_published' });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elections'] });
      queryClient.invalidateQueries({ queryKey: ['elections', electionId] });
    },
  });

  const results = useMemo(() => {
    if (!election || !backendData) return [];
    return processBackendResults(backendData, election);
  }, [election, backendData]);

  if (electionLoading) {
    return <AdminShell title="Loading..."><div className="h-64 flex items-center justify-center">Loading...</div></AdminShell>;
  }

  if (!election) {
    return (
      <AdminShell title="Election not found">
        <Link to="/admin/elections" className="text-primary hover:underline">← Back to elections</Link>
      </AdminShell>
    );
  }

  const turnout = electionTurnout(election);
  const allPublishable = results.every(isPositionPublishable);
  
  // Real integrity check
  const totalCast = backendData?.totalBallotsCast || 0;
  const successfullyDecrypted = backendData?.successfullyDecrypted || 0;
  const integrityOk = totalCast > 0 && totalCast === successfullyDecrypted;
  
  const published = election.status === "results_published";

  const onPublish = async () => {
    await publishResults();
    setConfirmPublish(false);
    navigate({ to: "/results/$electionId", params: { electionId: election.id } });
  };

  return (
    <AdminShell
      title="Tally Review"
      actions={
        <div className="flex items-center gap-2">
          <StatusBadge status={election.status} />
          {published ? (
            <Link to="/results/$electionId" params={{ electionId: election.id }}>
              <SecondaryButton>View Public Results</SecondaryButton>
            </Link>
          ) : (
            <PrimaryButton disabled={!allPublishable || isPublishing} onClick={() => setConfirmPublish(true)}>
              {isPublishing ? 'Publishing...' : 'Publish Results'}
            </PrimaryButton>
          )}
        </div>
      }
    >
      <div className="mb-4">
        <Link
          to="/admin/elections/$electionId"
          params={{ electionId: election.id }}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← Back to election
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-stretch">
        {isLoading && (
          <div className="w-full rounded-md border border-border bg-surface p-4 text-center text-sm text-muted-foreground">
            Decrypting and tallying votes...
          </div>
        )}
        {error && (
          <div className="w-full rounded-md border border-destructive bg-destructive/10 p-4 text-center text-sm text-destructive">
            Failed to load results. Ensure the election is fully closed and the private key is available.
          </div>
        )}
        {!isLoading && !error && (
          <>
            {/* Integrity */}
        <div
          className={
            "htu-card flex-1 p-4 " +
            (integrityOk ? "" : "border-destructive/40")
          }
        >
          <div className="flex items-center gap-3">
            {integrityOk ? (
              <div className="grid h-10 w-10 place-items-center rounded-full bg-success/15 text-success">
                <ShieldCheck className="h-5 w-5" />
              </div>
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-full bg-destructive/15 text-destructive">
                <AlertOctagon className="h-5 w-5" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-foreground">
                {integrityOk ? "Vote record integrity verified" : "Integrity check failed"}
              </p>
              <p className="text-xs text-muted-foreground">
                {integrityOk
                  ? "All ballot hashes match the audit trail."
                  : "Discrepancy detected. Results cannot be published."}
              </p>
            </div>
          </div>
        </div>
        {/* Turnout */}
        <div className="htu-card flex-1 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Turnout</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {turnout.voted} <span className="text-base font-medium text-muted-foreground">/ {turnout.total}</span>{" "}
            <span className="text-base font-semibold text-primary">({turnout.pct}%)</span>
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div className="h-full bg-primary" style={{ width: turnout.pct + "%" }} />
          </div>
        </div>
          </>
        )}
      </div>

      {!allPublishable && (
        <div className="mb-6 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            One or more positions are unresolved. Trigger runoffs or resolve ties before publishing results.
          </div>
        </div>
      )}

      <div className="space-y-5">
        {results.map((r) => (
          <PositionTallyCard key={r.position.id} result={r} />
        ))}
      </div>

      <ConfirmDialog
        open={confirmPublish}
        onClose={() => setConfirmPublish(false)}
        onConfirm={onPublish}
        title="Publish results to the public?"
        description="Once published, the results page will be visible to all voters. This action cannot be undone."
        confirmLabel="Publish Results"
      />
    </AdminShell>
  );
}

function PositionTallyCard({ result }: { result: PositionResult }) {
  const { position, tallies, abstain, validVotes, outcome, isSingleCandidate } = result;
  const maxVotes = Math.max(1, ...tallies.map((t) => t.votes));

  const isApproved = isSingleCandidate && outcome.kind === "decided" && outcome.winners.length > 0;
  const soleCandidate = isSingleCandidate && tallies[0] ? tallies[0] : null;
  const yesVotes = isSingleCandidate && soleCandidate ? (soleCandidate.yesVotes || 0) : 0;
  const noVotes = isSingleCandidate && soleCandidate ? (soleCandidate.noVotes || 0) : 0;
  const yesPct = validVotes ? (yesVotes / validVotes) * 100 : 0;
  const noPct = validVotes ? (noVotes / validVotes) * 100 : 0;

  return (
    <div className="htu-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/60 px-5 py-3">
        <div>
          <h3 className="font-semibold text-foreground">{position.title}</h3>
          <p className="text-xs text-muted-foreground">
            {isSingleCandidate
              ? "YES/NO Confirmation Vote"
              : position.countingMethod === "plurality" ? "Plurality" : "Simple Majority"}{" "}
            · {validVotes.toLocaleString()} valid votes
          </p>
        </div>
        <OutcomeBadge result={result} />
      </div>

      {isSingleCandidate && soleCandidate ? (
        <div className="divide-y divide-border">
          {/* Candidate Info Header */}
          <div className="bg-primary/5 px-5 py-4 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {soleCandidate.candidate.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
            </div>
            <div>
              <p className="font-semibold text-foreground">{soleCandidate.candidate.name}</p>
              <p className="text-xs text-muted-foreground">Sole Candidate</p>
            </div>
          </div>
          
          <ul className="divide-y divide-border">
            {/* YES Votes */}
            <li className="px-5 py-4">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-success">YES (Approve)</span>
                  {isApproved && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success border border-success/20">
                      Approved
                    </span>
                  )}
                </div>
                <div className="shrink-0 text-sm tabular-nums text-foreground">
                  <span className="font-bold">{yesVotes.toLocaleString()}</span>{" "}
                  <span className="text-muted-foreground">({yesPct.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full transition-[width] bg-success"
                  style={{ width: yesPct + "%" }}
                />
              </div>
            </li>

            {/* NO Votes */}
            <li className="px-5 py-4">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-destructive">NO (Reject)</span>
                  {!isApproved && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive border border-destructive/20">
                      Rejected
                    </span>
                  )}
                </div>
                <div className="shrink-0 text-sm tabular-nums text-foreground">
                  <span className="font-bold">{noVotes.toLocaleString()}</span>{" "}
                  <span className="text-muted-foreground">({noPct.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full transition-[width] bg-destructive"
                  style={{ width: noPct + "%" }}
                />
              </div>
            </li>
          </ul>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {tallies.map((t, i) => {
            const isTopGroup =
              outcome.kind === "tie"
                ? outcome.tied.some((x) => x.candidate.id === t.candidate.id)
                : outcome.kind === "decided"
                  ? outcome.winners[0]?.candidate.id === t.candidate.id
                  : i < 2;
            return (
              <li key={t.candidate.id} className="px-5 py-4">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{t.candidate.name}</span>
                    {isTopGroup && outcome.kind === "decided" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        <Trophy className="h-3 w-3" /> Winner
                      </span>
                    )}
                  </div>
                  <div className="shrink-0 text-sm tabular-nums text-foreground">
                    <span className="font-semibold">{t.votes.toLocaleString()}</span>{" "}
                    <span className="text-muted-foreground">({t.pct.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className={
                      "h-full transition-[width] " +
                      (outcome.kind === "tie" && isTopGroup
                        ? "bg-destructive"
                        : outcome.kind === "no_majority" && isTopGroup
                          ? "bg-amber-500"
                          : "bg-primary")
                    }
                    style={{ width: (t.votes / maxVotes) * 100 + "%" }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-center justify-between border-t border-border bg-surface/40 px-5 py-2.5 text-xs">
        <span className="font-medium uppercase tracking-wider text-muted-foreground">Abstentions</span>
        <span className="tabular-nums text-foreground">{abstain.toLocaleString()}</span>
      </div>
    </div>
  );
}

function OutcomeBadge({ result }: { result: PositionResult }) {
  const { outcome, isSingleCandidate } = result;

  if (isSingleCandidate) {
    const isApproved = outcome.kind === "decided" && outcome.winners.length > 0;
    return isApproved ? (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
        Approved
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
        Rejected
      </span>
    );
  }

  if (outcome.kind === "decided") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
        Resolved
      </span>
    );
  }
  if (outcome.kind === "no_majority") {
    return (
      <div className="flex flex-col items-end gap-0.5 text-right">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700">
          <AlertTriangle className="h-3 w-3" /> No Majority Reached
        </span>
        <span className="text-[11px] text-muted-foreground">
          {outcome.nextStep === "runoff"
            ? `Runoff will be triggered between ${outcome.top.map((t) => t.candidate.name).join(" and ")}`
            : "Falls back to plurality — top candidate wins"}
        </span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-end gap-1.5 text-right">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
        <AlertOctagon className="h-3 w-3" /> Unresolved — Tie
      </span>
      <span className="text-[11px] text-muted-foreground">
        Tied: {outcome.tied.map((t) => t.candidate.name).join(", ")}
      </span>
      <PrimaryButton className="px-3 py-1.5 text-xs">Trigger Runoff</PrimaryButton>
    </div>
  );
}
