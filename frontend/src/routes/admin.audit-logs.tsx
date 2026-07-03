import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Shield, Activity, User, Key, Mail, Lock, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/audit-logs")({
  component: AuditLogsPage,
});

const getActionIcon = (action: string) => {
  if (action.includes("CREATE")) return <Plus className="w-4 h-4 text-green-500" />;
  if (action.includes("DELETE") || action.includes("REMOVE")) return <Trash2 className="w-4 h-4 text-red-500" />;
  if (action.includes("LOGIN")) return <User className="w-4 h-4 text-blue-500" />;
  if (action.includes("LOCK")) return <Lock className="w-4 h-4 text-orange-500" />;
  if (action.includes("TOKEN")) return <Key className="w-4 h-4 text-purple-500" />;
  if (action.includes("EMAIL")) return <Mail className="w-4 h-4 text-indigo-500" />;
  return <Activity className="w-4 h-4 text-gray-500" />;
};

function AuditLogsPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: async () => {
      const res = await api.get("/admin/audit-logs");
      return res.data;
    },
  });

  return (
    <AdminShell title="System Audit Logs">
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="border-b border-border px-4 py-4 bg-surface flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Security Trail
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Immutable record of critical system and administrative actions.
            </p>
          </div>
          <div className="text-xs text-muted-foreground bg-white px-3 py-1 rounded-full border border-border">
            {logs?.length || 0} Events Recorded
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">TIMESTAMP</th>
                <th className="px-4 py-3 font-medium">ACTION</th>
                <th className="px-4 py-3 font-medium">ENTITY TYPE</th>
                <th className="px-4 py-3 font-medium">ACTOR ID</th>
                <th className="px-4 py-3 font-medium">DETAILS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No security events found.
                  </td>
                </tr>
              ) : (
                logs?.map((log: any) => (
                  <tr key={log.id} className="hover:bg-surface/30">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-medium">
                        {getActionIcon(log.action)}
                        {log.action}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-mono">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground truncate max-w-[120px]">
                      {log.actorId || "System"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
