import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { ShieldAlert, Trash2, Plus, Shield } from "lucide-react";

export const Route = createFileRoute("/admin/officials")({
  component: OfficialsPage,
});

function OfficialsPage() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"super_admin" | "election_officer">("election_officer");

  const { data: users, isLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const res = await api.get("/admin/users");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { email: string; role: string }) => {
      await api.post("/admin/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setEmail("");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to create user");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to delete user");
    },
  });

  return (
    <AdminShell title="EC Officials Management">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Add Official Form */}
        <div className="rounded-xl border border-border bg-white shadow-sm lg:col-span-1 h-fit">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Add New Official</h3>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Google Workspace Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. EC-member@htu.edu.gh"
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                System Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="election_officer">Election Officer</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            
            <div className="rounded-md bg-blue-50 p-3 flex gap-2 items-start border border-blue-100">
              <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">
                <strong>Super Admin</strong> can manage other EC officials and view audit logs.<br/>
                <strong>Election Officer</strong> can only manage elections and voters.
              </p>
            </div>

            <button
              onClick={() => {
                if (!email) return alert("Enter an email");
                createMutation.mutate({ email, role });
              }}
              disabled={createMutation.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {createMutation.isPending ? "Adding..." : "Add Official"}
            </button>
          </div>
        </div>

        {/* Officials Table */}
        <div className="rounded-xl border border-border bg-white shadow-sm lg:col-span-2 overflow-hidden">
          <div className="border-b border-border px-4 py-3 bg-surface">
            <h3 className="text-sm font-semibold text-foreground">Registered Officials</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">EMAIL</th>
                  <th className="px-4 py-3 font-medium">ROLE</th>
                  <th className="px-4 py-3 font-medium">ADDED ON</th>
                  <th className="px-4 py-3 text-right font-medium">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : users?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No officials found.
                    </td>
                  </tr>
                ) : (
                  users?.map((u: any) => (
                    <tr key={u.id} className="hover:bg-surface/30">
                      <td className="px-4 py-3 font-medium">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {u.role === 'super_admin' && <Shield className="w-3 h-3" />}
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            if (window.confirm("Remove this official?")) {
                              deleteMutation.mutate(u.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:text-destructive/80 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
