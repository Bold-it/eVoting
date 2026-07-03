import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AdminShell, PrimaryButton, StatusBadge } from "@/components/admin/AdminShell";
import { useElections } from "@/lib/queries";

export const Route = createFileRoute("/admin/elections/")({
  head: () => ({ meta: [{ title: "Elections — HTU Admin" }] }),
  component: ElectionsPage,
});

function ElectionsPage() {
  const { data: elections, isLoading } = useElections();
  const navigate = useNavigate();

  return (
    <AdminShell
      title="Elections"
      actions={
        <PrimaryButton onClick={() => navigate({ to: "/admin/elections/new" })}>
          <Plus className="h-4 w-4" /> Create New Election
        </PrimaryButton>
      }
    >
      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">Loading elections...</div>
      ) : !elections?.length ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">No elections found. Create one!</div>
      ) : (
      <div className="htu-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-semibold">Election</th>
                <th className="px-5 py-3 text-left font-semibold">Voting Window</th>
                <th className="px-5 py-3 text-left font-semibold">Positions</th>
                <th className="px-5 py-3 text-left font-semibold">Turnout</th>
                <th className="px-5 py-3 text-left font-semibold">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {elections.map((e) => {
                const voted = e._count?.VoteRecords || 0;
                const total = e._count?.Voters || 0;
                const pct = total ? Math.round((voted / total) * 100) : 0;
                return (
                  <tr key={e.id} className="hover:bg-surface/60">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-foreground">{e.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{e.description}</div>
                    </td>
                    <td className="px-5 py-4 text-foreground">
                      <div>{formatDate(e.startTime)}</div>
                      <div className="text-xs text-muted-foreground">to {formatDate(e.endTime)}</div>
                    </td>
                    <td className="px-5 py-4 text-foreground">{e._count?.Positions || 0}</td>
                    <td className="px-5 py-4">
                      {e.status === "open" || e.status === "closed" || e.status === "results_published" ? (
                        <div>
                          <div className="font-medium text-foreground">{voted} / {total} <span className="text-muted-foreground">({pct}%)</span></div>
                          <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-border">
                            <div className="h-full bg-primary" style={{ width: pct + "%" }} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={e.status} /></td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to="/admin/elections/$electionId"
                        params={{ electionId: e.id }}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </AdminShell>
  );
}

function formatDate(s: string | null) {
  if (!s) return "Not set";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "Not set";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
