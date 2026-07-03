import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Users, UserCheck, KeyRound, ChevronRight } from "lucide-react";
import { AdminShell, StatusBadge } from "@/components/admin/AdminShell";
import { useAdminState } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/voters")({
  head: () => ({ meta: [{ title: "Voter Roll — HTU Admin" }] }),
  component: VotersIndex,
});

function VotersIndex() {
  const { elections } = useAdminState();
  const [electionId, setElectionId] = useState<string>(elections[0]?.id ?? "");
  const [query, setQuery] = useState("");

  const totals = useMemo(() => {
    const allVoters = elections.flatMap((e) => e.voters);
    const voted = allVoters.filter((v) => v.voted).length;
    const tokens = allVoters.filter((v) => v.token).length;
    return { count: allVoters.length, voted, tokens };
  }, [elections]);

  const election = elections.find((e) => e.id === electionId) ?? elections[0];
  const voters = election?.voters ?? [];
  const filteredVoters = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return voters;
    return voters.filter(
      (v) => v.studentId.toLowerCase().includes(q) || v.name.toLowerCase().includes(q),
    );
  }, [voters, query]);

  const electionVoted = voters.filter((v) => v.voted).length;
  const pct = voters.length === 0 ? 0 : Math.round((electionVoted / voters.length) * 100);

  return (
    <AdminShell title="Voter Roll">
      {/* Aggregate stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total registered" value={totals.count} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Have voted" value={totals.voted} icon={<UserCheck className="h-5 w-5" />} />
        <StatCard label="Tokens issued" value={totals.tokens} icon={<KeyRound className="h-5 w-5" />} />
      </div>

      {/* Election picker */}
      <div className="htu-card mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Election
          </label>
          <select
            value={election?.id}
            onChange={(e) => setElectionId(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {elections.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>
        {election && (
          <Link
            to="/admin/elections/$electionId"
            params={{ electionId: election.id }}
            className="inline-flex items-center gap-1 self-end text-sm font-semibold text-primary hover:underline sm:self-auto"
          >
            Manage election <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {election && (
        <>
          <div className="htu-card mb-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{election.title}</h3>
                  <StatusBadge status={election.status} />
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {electionVoted.toLocaleString()} of {voters.length.toLocaleString()} voted · {pct}% turnout
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{pct}%</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Turnout</div>
              </div>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Search */}
          <div className="htu-card mb-4 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by Student ID or name…"
                className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Table */}
          <div className="htu-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-surface/60 px-5 py-3">
              <h3 className="font-semibold text-foreground">Registered Voters</h3>
              <span className="text-xs text-muted-foreground">
                Showing {filteredVoters.length.toLocaleString()} of {voters.length.toLocaleString()}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">Student ID</th>
                    <th className="px-5 py-3 text-left font-semibold">Name</th>
                    <th className="px-5 py-3 text-left font-semibold">Token</th>
                    <th className="px-5 py-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredVoters.slice(0, 100).map((v) => (
                    <tr key={v.studentId} className="hover:bg-surface/60">
                      <td className="px-5 py-3 font-mono text-xs text-foreground">{v.studentId}</td>
                      <td className="px-5 py-3 text-foreground">{v.name}</td>
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                        {v.token ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        {v.voted ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                            <UserCheck className="h-3 w-3" /> Voted
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredVoters.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">
                        No voters match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredVoters.length > 100 && (
              <div className="border-t border-border bg-surface/60 px-5 py-2.5 text-center text-xs text-muted-foreground">
                Showing first 100 results. Refine your search to narrow further.
              </div>
            )}
          </div>
        </>
      )}
    </AdminShell>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="htu-card flex items-center gap-4 p-5">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-2xl font-bold text-foreground">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
      </div>
    </div>
  );
}
