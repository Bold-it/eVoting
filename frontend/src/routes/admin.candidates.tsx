import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Users, Award, ChevronRight } from "lucide-react";
import { AdminShell, StatusBadge } from "@/components/admin/AdminShell";
import { useAdminState } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/candidates")({
  head: () => ({ meta: [{ title: "Candidates — HTU Admin" }] }),
  component: CandidatesIndex,
});

function CandidatesIndex() {
  const { elections } = useAdminState();
  const [query, setQuery] = useState("");
  const [electionFilter, setElectionFilter] = useState<string>("all");

  const allCandidates = useMemo(() => {
    return elections.flatMap((e) =>
      e.candidates.map((c) => ({
        ...c,
        electionId: e.id,
        electionTitle: e.title,
        electionStatus: e.status,
        positionTitle: e.positions.find((p) => p.id === c.positionId)?.title ?? "—",
      })),
    );
  }, [elections]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allCandidates.filter((c) => {
      if (electionFilter !== "all" && c.electionId !== electionFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.positionTitle.toLowerCase().includes(q) ||
        c.electionTitle.toLowerCase().includes(q)
      );
    });
  }, [allCandidates, query, electionFilter]);

  const totalPositions = elections.reduce((s, e) => s + e.positions.length, 0);

  return (
    <AdminShell title="Candidates">
      {/* Stat cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total candidates" value={allCandidates.length} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Positions across elections" value={totalPositions} icon={<Award className="h-5 w-5" />} />
        <StatCard label="Active elections" value={elections.filter((e) => e.status === "Open").length} icon={<Users className="h-5 w-5" />} />
      </div>

      {/* Toolbar */}
      <div className="htu-card mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, position, or election…"
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={electionFilter}
          onChange={(e) => setElectionFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">All elections</option>
          {elections.map((e) => (
            <option key={e.id} value={e.id}>{e.title}</option>
          ))}
        </select>
      </div>

      {/* Per-election grouped sections */}
      <div className="space-y-6">
        {elections
          .filter((e) => electionFilter === "all" || e.id === electionFilter)
          .map((e) => {
            const list = filtered.filter((c) => c.electionId === e.id);
            return (
              <section key={e.id} className="htu-card overflow-hidden">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/60 px-5 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-foreground">{e.title}</h3>
                      <StatusBadge status={e.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {e.positions.length} positions · {e.candidates.length} candidates
                    </p>
                  </div>
                  <Link
                    to="/admin/elections/$electionId"
                    params={{ electionId: e.id }}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                  >
                    Manage <ChevronRight className="h-4 w-4" />
                  </Link>
                </header>

                {list.length === 0 ? (
                  <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No candidates match your filters.
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {list.map((c) => (
                      <li key={c.id} className="flex items-center gap-4 px-5 py-4">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {c.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium text-foreground">{c.name}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {c.positionTitle}
                          </div>
                        </div>
                        <span className="hidden rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium text-muted-foreground sm:inline-flex">
                          {c.positionTitle}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
      </div>
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
        <div className="mt-0.5 text-2xl font-bold text-foreground">{value}</div>
      </div>
    </div>
  );
}
