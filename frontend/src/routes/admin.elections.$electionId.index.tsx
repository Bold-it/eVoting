import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, Download, Plus, Trash2, Edit2, Lock, CheckCircle2, AlertTriangle, Users, BarChart3, Settings, ScrollText } from "lucide-react";
import {
  AdminShell,
  DangerButton,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
} from "@/components/admin/AdminShell";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { type Voter } from "@/lib/admin-store";
import { useElection, useUpdateElection, useCreateCandidate, useDeleteCandidate, useElectionVoters, useUploadVoters, useGenerateTokens, useClearVoters, type Candidate } from "@/lib/queries";

export const Route = createFileRoute("/admin/elections/$electionId/")({
  head: () => ({ meta: [{ title: "Manage Election — HTU Admin" }] }),
  component: ManageElection,
});

type Tab = "candidates" | "voters" | "turnout" | "settings";

function ManageElection() {
  const { electionId } = Route.useParams();
  const { data: election, isLoading } = useElection(electionId);
  const { mutateAsync: updateElection } = useUpdateElection();
  const hash = useRouterState({ select: (s) => s.location.hash });
  const initialTab = (["candidates", "voters", "turnout", "settings"].includes(hash) ? hash : "candidates") as Tab;
  const [tab, setTab] = useState<Tab>(initialTab);
  const [openDialog, setOpenDialog] = useState<"open" | "close" | null>(null);

  if (isLoading) {
    return <AdminShell title="Loading..."><div className="h-64 flex items-center justify-center">Loading election details...</div></AdminShell>;
  }

  if (!election) {
    return (
      <AdminShell title="Election not found">
        <Link to="/admin/elections" className="text-primary hover:underline">
          ← Back to elections
        </Link>
      </AdminShell>
    );
  }

  const locked = election.status !== "draft";

  const tabs: { id: Tab; label: string }[] = [
    { id: "candidates", label: "Candidates" },
    { id: "voters", label: "Voter Roll" },
    { id: "turnout", label: "Live Turnout" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <AdminShell
      title={election.title}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={election.status} />
          {election.status === "draft" && (
            <PrimaryButton onClick={() => setOpenDialog("open")}>Open Election</PrimaryButton>
          )}
          {election.status === "open" && (
            <DangerButton onClick={() => setOpenDialog("close")}>Close Election</DangerButton>
          )}
          {(election.status === "closed" || election.status === "results_published") && (
            <Link
              to="/admin/elections/$electionId/tally"
              params={{ electionId: election.id }}
            >
              <PrimaryButton>
                {election.status === "closed" ? "Review Tally" : "View Tally"}
              </PrimaryButton>
            </Link>
          )}
        </div>
      }
    >
      <div className="mb-4">
        <Link to="/admin/elections" className="text-sm text-muted-foreground hover:text-primary">
          ← All elections
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              "border-b-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px " +
              (tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "candidates" && <CandidatesTab election={election} locked={locked} />}
      {tab === "voters" && <VotersTab election={election} locked={locked} />}
      {tab === "turnout" && <TurnoutTab election={election} />}
      {tab === "settings" && <SettingsTab election={election} />}

      <ConfirmDialog
        open={openDialog === "open"}
        onClose={() => setOpenDialog(null)}
        onConfirm={() => {
          updateElection({ id: election.id, action: "open" });
          setOpenDialog(null);
        }}
        title="Open this election?"
        description="Once opened, candidates, positions, counting rules, and the voter roll are locked. Voting will begin immediately."
        confirmLabel="Open Election"
      />
      <ConfirmDialog
        open={openDialog === "close"}
        onClose={() => setOpenDialog(null)}
        onConfirm={() => {
          updateElection({ id: election.id, action: "close" });
          setOpenDialog(null);
        }}
        title="Close this election?"
        description="No further votes will be accepted. This action cannot be undone."
        confirmLabel="Close Election"
        destructive
      />

    </AdminShell>
  );
}

// ---------- Candidates ----------

function CandidatesTab({ election, locked }: { election: any; locked: boolean }) {
  const [adding, setAdding] = useState<string | null>(null);
  const [editing, setEditing] = useState<Candidate | null>(null);
  const [deleting, setDeleting] = useState<Candidate | null>(null);
  const { mutate: deleteCandidate } = useDeleteCandidate();

  return (
    <div className="space-y-6">
      {locked && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <Lock className="h-4 w-4" /> Locked — election is live. Candidate edits are disabled.
        </div>
      )}

      {election.Positions?.length === 0 ? (
        <div className="htu-card p-6 text-center text-sm text-muted-foreground">
          No positions defined for this election.
        </div>
      ) : (
        election.Positions?.map((p: any) => {
          const list = p.Candidates || [];
          return (
            <div key={p.id} className="htu-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border bg-surface/60 px-5 py-3">
                <div>
                  <h3 className="font-semibold text-foreground">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {list.length} candidate{list.length === 1 ? "" : "s"} ·{" "}
                    {p.countingMethod === "plurality" ? "Plurality" : "Simple Majority"}
                  </p>
                </div>
                {!locked && (
                  <SecondaryButton onClick={() => setAdding(p.id)}>
                    <Plus className="h-4 w-4" /> Add Candidate
                  </SecondaryButton>
                )}
              </div>
              <ul className="divide-y divide-border">
                {list.length === 0 && (
                  <li className="px-5 py-6 text-center text-sm text-muted-foreground">No candidates yet.</li>
                )}
                {list.map((c: any) => (
                  <li key={c.id} className="flex items-center gap-4 px-5 py-4">
                    {c.photoUrl ? (
                      <img src={c.photoUrl} alt={c.name} className="h-12 w-12 shrink-0 rounded-full object-cover border border-border" />
                    ) : (
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {c.name.split(" ").map((s: string) => s[0]).slice(0, 2).join("")}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground">{c.name}</div>
                      <div className="line-clamp-1 text-xs text-muted-foreground">{c.manifesto}</div>
                    </div>
                    {!locked && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditing(c)}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleting(c)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Remove candidate"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })
      )}

      {(adding || editing) && (
        <CandidateDialog
          election={election}
          initial={editing}
          defaultPositionId={adding ?? editing?.positionId ?? ""}
          onClose={() => {
            setAdding(null);
            setEditing(null);
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          open={!!deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            deleteCandidate(deleting.id);
            setDeleting(null);
          }}
          title="Delete Candidate?"
          description={`Are you sure you want to delete ${deleting.name}? This cannot be undone.`}
          confirmLabel="Delete"
          destructive
        />
      )}
    </div>
  );
}

function CandidateDialog({
  election,
  initial,
  defaultPositionId,
  onClose,
}: {
  election: any;
  initial: Candidate | null;
  defaultPositionId: string;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [positionId, setPositionId] = useState(initial?.positionId ?? defaultPositionId);
  const [manifesto, setManifesto] = useState(initial?.manifesto ?? "");
  const [credentials, setCredentials] = useState<string[]>(
    initial?.credentials ? (typeof initial.credentials === 'string' ? JSON.parse(initial.credentials) : initial.credentials) : [""]
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(initial?.photoUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync: createCandidate, isPending } = useCreateCandidate();

  const MAX = 500;

  const save = async () => {
    setError(null);
    const cleanCreds = credentials.map((c) => c.trim()).filter(Boolean);
    if (!name.trim() || !positionId) {
      setError("Please fill in all required fields.");
      return;
    }

    const fd = new FormData();
    fd.append('name', name.trim());
    fd.append('manifesto', manifesto);
    fd.append('credentials', JSON.stringify(cleanCreds));
    if (photoFile) fd.append('photo', photoFile);

    try {
      if (initial) {
        console.log("implement update", initial.id);
      } else {
        await createCandidate({ positionId, formData: fd });
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to save candidate.");
    }
  };

  const onPhoto = (f: File | null) => {
    if (!f) return;
    setPhotoFile(f);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4 py-8 overflow-y-auto">
      <div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-elevated">
        <h2 className="text-lg font-semibold">{initial ? "Edit Candidate" : "Add Candidate"}</h2>
        
        {error && (
          <div className="mt-4 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Full Name <span className="text-destructive">*</span></label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Position Contested <span className="text-destructive">*</span></label>
            <select
              value={positionId}
              onChange={(e) => setPositionId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">— Select position —</option>
              {election.Positions?.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Profile Photo (Max 5MB)</label>
            <div className="flex items-center gap-4">
              <label className="group relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-border bg-surface transition-colors hover:border-primary hover:bg-primary/5">
                {photoPreview ? (
                  <img src={photoPreview} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onPhoto(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
              <div className="text-sm text-muted-foreground">
                {photoPreview ? (
                  <button type="button" onClick={() => onPhoto(null)} className="text-destructive hover:underline">Remove photo</button>
                ) : (
                  <span>PNG, JPG up to 5MB</span>
                )}
              </div>
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-sm font-medium">Manifesto / Personal Statement</label>
              <span className={"text-xs " + (manifesto.length > MAX ? "text-destructive" : "text-muted-foreground")}>
                {manifesto.length}/{MAX}
              </span>
            </div>
            <textarea
              value={manifesto}
              onChange={(e) => setManifesto(e.target.value.slice(0, MAX))}
              rows={4}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Credentials / Past Roles</label>
            <div className="space-y-2">
              {credentials.map((cr, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={cr}
                    onChange={(e) => setCredentials(credentials.map((c, j) => (j === i ? e.target.value : c)))}
                    placeholder="e.g. Class Rep 2024"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    onClick={() => setCredentials(credentials.filter((_, j) => j !== i))}
                    disabled={credentials.length === 1}
                    className="rounded-md border border-input p-2 text-muted-foreground hover:text-destructive disabled:opacity-40"
                    aria-label="Remove credential"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setCredentials([...credentials, ""])}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                <Plus className="h-4 w-4" /> Add credential
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <SecondaryButton onClick={onClose} disabled={isPending}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={isPending}>{isPending ? "Saving..." : (initial ? "Save Changes" : "Add Candidate")}</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

// ---------- Voters ----------

function VotersTab({ election }: { election: any }) {
  const locked = election.status !== "draft";
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<any[] | null>(null);
  
  const [singleId, setSingleId] = useState("");
  const [singleName, setSingleName] = useState("");

  const { data: voters = [], isLoading } = useElectionVoters(election.id);
  const { mutateAsync: uploadVoters, isPending } = useUploadVoters();
  const { mutate: generateTokens, isPending: isGenerating } = useGenerateTokens();
  const { mutate: clearVoters, isPending: isClearing } = useClearVoters();

  const parseCSV = (text: string) => {
    return text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const parts = l.split(",").map((s) => s.trim());
        let studentId = parts[0];
        
        // HTU Student IDs are 10 digits starting with 0. 
        // If Excel stripped the leading zero (making it 9 digits), restore it!
        if (studentId.length === 9 && /^\d+$/.test(studentId)) {
          studentId = '0' + studentId;
        }
        let email = "";
        let name = "";
        if (parts.length >= 3 && parts[parts.length - 1].includes("@")) {
          email = parts[parts.length - 1];
          name = parts.slice(1, parts.length - 1).join(" ");
        } else {
          name = parts.slice(1).join(" ");
          email = `${studentId.toLowerCase()}@htu.edu.gh`;
        }
        return { studentId, name: name || studentId, email };
      })
      .filter((v) => v.studentId && v.email && !/student\s*id/i.test(v.studentId));
  };

  const handleFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCSV(reader.result as string);
      setPreview(parsed);
    };
    reader.readAsText(f);
  };

  const commit = async () => {
    if (preview) {
      await uploadVoters({ electionId: election.id, voters: preview });
      setPreview(null);
    }
  };

  const addSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleId || !singleName) return;
    const email = `${singleId.toLowerCase()}@htu.edu.gh`;
    await uploadVoters({ electionId: election.id, voters: [{ studentId: singleId, name: singleName, email }] });
    setSingleId("");
    setSingleName("");
  };

  const tokens = voters.filter((v: any) => v.token);

  return (
    <div className="space-y-6">
      {/* Full-screen Loading Overlay for Token Generation */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-8 shadow-2xl">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground">Generating Secure Tokens</h3>
              <p className="mt-2 max-w-[320px] text-sm text-muted-foreground">
                Please wait while we generate cryptographically secure tokens and dispatch them to the students' emails. Do not close this window.
              </p>
            </div>
          </div>
        </div>
      )}

      {locked && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <Lock className="h-4 w-4" /> Locked — election is live. Voter roll is read-only.
        </div>
      )}

      {!locked && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* CSV Upload */}
          <div className="htu-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground">Upload Voter Roll</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  CSV with two columns: <span className="font-mono">StudentID,Name</span>
                </p>
              </div>
              <a
                href={`data:text/csv;charset=utf-8,${encodeURIComponent("StudentID,Name\n040918001,John Doe\n040918002,Jane Smith\n040918003,Alex Johnson")}`}
                download="sample_voters.csv"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Download className="h-4 w-4" /> Sample CSV
              </a>
            </div>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
              className={
                "mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-6 text-center transition-colors " +
                (dragOver ? "border-primary bg-primary/5" : "border-border bg-surface hover:border-primary/40")
              }
            >
              <Upload className="h-8 w-8 text-primary" />
              <div className="text-sm font-medium text-foreground">Drop a CSV file here, or click to browse</div>
              <div className="text-xs text-muted-foreground">Up to ~10,000 rows</div>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
          </div>

          {/* Single Add */}
          <div className="htu-card p-6 flex flex-col">
            <div>
              <h3 className="font-semibold text-foreground">Add Individual Voter</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Manually register a single student.
              </p>
            </div>
            <form onSubmit={addSingle} className="mt-4 flex flex-1 flex-col justify-end space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Student ID
                </label>
                <input
                  type="text"
                  required
                  value={singleId}
                  onChange={(e) => setSingleId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. 0325080504"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. Moses Nyarko"
                />
              </div>
              <PrimaryButton type="submit" disabled={isPending || !singleId || !singleName}>
                {isPending ? "Adding..." : "Add Voter"}
              </PrimaryButton>
            </form>
          </div>
        </div>
      )}

      {preview && (
        <div className="htu-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-surface/60 px-5 py-3">
            <div>
              <h3 className="font-semibold">Preview</h3>
              <p className="text-xs text-muted-foreground">{preview.length} voters loaded</p>
            </div>
            <div className="flex gap-2">
              <SecondaryButton onClick={() => setPreview(null)} disabled={isPending}>Discard</SecondaryButton>
              <PrimaryButton onClick={commit} disabled={isPending}>
                {isPending ? "Uploading..." : "Confirm Upload"}
              </PrimaryButton>
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-2 text-left">Student ID</th>
                  <th className="px-5 py-2 text-left">Name</th>
                  <th className="px-5 py-2 text-left">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preview.slice(0, 100).map((v) => (
                  <tr key={v.studentId}>
                    <td className="px-5 py-2 font-mono">{v.studentId}</td>
                    <td className="px-5 py-2">{v.name}</td>
                    <td className="px-5 py-2">{v.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 100 && (
              <div className="border-t border-border px-5 py-2 text-center text-xs text-muted-foreground">
                + {preview.length - 100} more rows
              </div>
            )}
          </div>
        </div>
      )}

      {voters.length > 0 && (
        <div className="htu-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/60 px-5 py-3">
            <div>
              <h3 className="font-semibold">Voter Roll</h3>
              <p className="text-xs text-muted-foreground">
                {voters.length} voters · {voters.filter((v: any) => v.VoterToken).length} tokens generated
              </p>
            </div>
            <div className="flex gap-2">
              {!locked && voters.filter((v: any) => v.VoterToken).length < voters.length && (
                <PrimaryButton 
                  onClick={() => generateTokens(election.id)}
                  disabled={isGenerating}
                >
                  {isGenerating ? "Generating..." : "Generate Voting Tokens"}
                </PrimaryButton>
              )}
              {voters.filter((v: any) => v.VoterToken).length > 0 && (
                <SecondaryButton>
                  <Download className="h-4 w-4" /> Export
                </SecondaryButton>
              )}
              {!locked && (
                <DangerButton 
                  onClick={() => confirm("Are you sure you want to delete ALL voters and tokens?") && clearVoters(election.id)}
                  disabled={isClearing}
                >
                  <Trash2 className="h-4 w-4" /> {isClearing ? "Clearing..." : "Clear Roll"}
                </DangerButton>
              )}
            </div>
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-2 text-left">Student ID</th>
                  <th className="px-5 py-2 text-left">Name</th>
                  <th className="px-5 py-2 text-left">Token</th>
                  <th className="px-5 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {voters.slice(0, 50).map((v: any) => (
                  <tr key={v.studentId}>
                    <td className="px-5 py-2 font-mono">{v.studentId}</td>
                    <td className="px-5 py-2">{v.name}</td>
                    <td className="px-5 py-2">
                      {v.VoterToken ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" /> Generated
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-2">
                      {v.hasVoted ? (
                        <span className="text-success">Voted</span>
                      ) : (
                        <span className="text-muted-foreground">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {voters.length > 50 && (
              <div className="border-t border-border px-5 py-2 text-center text-xs text-muted-foreground">
                Showing first 50 of {voters.length} voters
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Turnout ----------

function TurnoutTab({ election }: { election: any }) {
  const voted = election._count?.VoteRecords || 0;
  const total = election._count?.Voters || 0;
  const pct = total ? Math.round((voted / total) * 100) : 0;
  const C = 2 * Math.PI * 80;

  if (election.status === "draft") {
    return (
      <div className="htu-card p-8 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Live turnout is available once the election is open.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="htu-card p-8">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Live Turnout</div>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <div className="text-5xl font-bold tracking-tight text-foreground">
            {voted.toLocaleString()} <span className="text-muted-foreground">/ {total.toLocaleString()}</span>
          </div>
          <div className="text-2xl font-semibold text-primary">{pct}%</div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">voters have cast their ballot</p>

        <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: pct + "%" }}
          />
        </div>

        <div className="mt-8 rounded-md border border-border bg-surface/60 px-4 py-3 text-sm text-muted-foreground">
          <strong className="text-foreground">Vote secrecy:</strong> No vote content or candidate standings
          are shown here. Results are revealed only after the election is closed and results are published.
        </div>
      </div>

      <div className="htu-card flex flex-col items-center justify-center p-8">
        <svg viewBox="0 0 200 200" className="h-48 w-48">
          <circle cx="100" cy="100" r="80" fill="none" stroke="var(--color-border)" strokeWidth="16" />
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct / 100)}
            transform="rotate(-90 100 100)"
          />
          <text x="100" y="100" textAnchor="middle" dominantBaseline="central" className="fill-foreground" style={{ fontSize: 28, fontWeight: 700 }}>
            {pct}%
          </text>
        </svg>
        <p className="mt-3 text-sm text-muted-foreground">Participation</p>
      </div>
    </div>
  );
}

// ---------- Settings ----------

function SettingsTab({ election }: { election: any }) {
  return (
    <div className="htu-card divide-y divide-border">
      <Detail label="Title" value={election.title} />
      <Detail label="Description" value={election.description || "—"} />
      <Detail label="Voting Window" value={`${formatDate(election.startTime)} → ${formatDate(election.endTime)}`} />
      <Detail
        label="Positions & Counting"
        value={
          <ul className="space-y-1">
            {election.Positions?.map((p: any) => (
              <li key={p.id} className="text-sm">
                <span className="font-medium">{p.name}</span> —{" "}
                <span className="text-muted-foreground">
                  {p.countingMethod === "plurality"
                    ? "Plurality"
                    : `Simple Majority (fallback: ${p.majorityFallback === "runoff" ? "Runoff" : "Plurality"})`}
                </span>
              </li>
            ))}
          </ul>
        }
      />
      <Detail label="Created" value={formatDate(election.createdAt)} />
    </div>
  );
}

function formatDate(s: string | null) {
  if (!s) return "Not set";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "Not set";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 px-5 py-4 sm:grid-cols-[200px_1fr]">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-foreground">{value}</div>
    </div>
  );
}
