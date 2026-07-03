import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ScrollText, ShieldCheck, Activity } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminState } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [{ title: "Audit Log — HTU Admin" }] }),
  component: AuditPage,
});

function AuditPage() {
  const { audit } = useAdminState();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return audit;
    return audit.filter(
      (a) => a.action.toLowerCase().includes(q) || a.actor.toLowerCase().includes(q),
    );
  }, [audit, query]);

  const actors = new Set(audit.map((a) => a.actor)).size;
  const today = audit.filter((a) => {
    const d = new Date(a.ts);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  return (
    <AdminShell title="Audit Log">
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total events" value={audit.length} icon={<ScrollText className="h-5 w-5" />} />
        <StatCard label="Distinct actors" value={actors} icon={<ShieldCheck className="h-5 w-5" />} />
        <StatCard label="Events today" value={today} icon={<Activity className="h-5 w-5" />} />
      </div>

      <div className="mb-4 flex items-start gap-3 rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          This log is <strong>append-only</strong> and read-only. Entries cannot be edited or deleted —
          they form a tamper-evident record of every administrative action.
        </p>
      </div>

      <div className="htu-card mb-4 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actions or actors…"
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="htu-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-semibold">Timestamp</th>
                <th className="px-5 py-3 text-left font-semibold">Actor</th>
                <th className="px-5 py-3 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-surface/60">
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-muted-foreground">
                    {new Date(a.ts).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    <span className="inline-flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                        {a.actor.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                      </span>
                      <span className="font-medium text-foreground">{a.actor}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-foreground">{a.action}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No events match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
