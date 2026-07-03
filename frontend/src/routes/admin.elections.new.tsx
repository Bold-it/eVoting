import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { AdminShell, PrimaryButton, SecondaryButton } from "@/components/admin/AdminShell";
import type { CountingMethod, MajorityFallback, Position } from "@/lib/admin-store";
import { useCreateElection } from "@/lib/queries";

export const Route = createFileRoute("/admin/elections/new")({
  head: () => ({ meta: [{ title: "Create Election — HTU Admin" }] }),
  component: NewElection,
});

const rid = () => Math.random().toString(36).slice(2, 9);

const STORAGE_KEY = "htu-draft-election";

function NewElection() {
  const navigate = useNavigate();

  // sessionStorage is tab-isolated — safe even with multiple admin tabs open
  const draft = (() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  })();

  const [step, setStep] = useState(draft?.step ?? 1);
  const [title, setTitle] = useState(draft?.title ?? "");
  const [description, setDescription] = useState(draft?.description ?? "");
  const [startAt, setStartAt] = useState(draft?.startAt ?? "");
  const [endAt, setEndAt] = useState(draft?.endAt ?? "");
  const [error, setError] = useState<string | null>(null);
  const [positions, setPositions] = useState<Position[]>(
    draft?.positions?.length > 0
      ? draft.positions
      : [{ id: "p" + rid(), title: "", countingMethod: "plurality", majorityFallback: "plurality" }]
  );

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step, title, description, startAt, endAt, positions }));
  }, [step, title, description, startAt, endAt, positions]);

  const steps = ["Details", "Positions", "Counting Rules", "Review"];

  let dateError: string | null = null;
  if (startAt && endAt) {
    const s = new Date(startAt);
    const e = new Date(endAt);
    if (e <= s) {
      dateError = "Voting End time must be after the Start time.";
    } else if (s < new Date(Date.now() - 5 * 60000)) {
      dateError = "Voting Start time cannot be in the past.";
    }
  }

  const canNext =
    (step === 1 && title.trim() && startAt && endAt && !dateError) ||
    (step === 2 && positions.length > 0 && positions.every((p) => p.title.trim())) ||
    step === 3 ||
    step === 4;

  const handleNext = () => {
    if (step === 1) {
      if (dateError) return;
      setError(null);
    }
    setStep(step + 1);
  };

  const { mutateAsync: createElection, isPending } = useCreateElection();

  const save = async () => {
    try {
      const election = {
        title,
        description,
        startTime: new Date(startAt).toISOString(),
        endTime: new Date(endAt).toISOString(),
      };
      
      const newEl = await createElection({ election, positions });
      sessionStorage.removeItem(STORAGE_KEY);
      navigate({ to: "/admin/elections/$electionId", params: { electionId: newEl.id } });
    } catch (err) {
      console.error("Failed to create election:", err);
      // We should ideally show a toast here.
    }
  };

  return (
    <AdminShell title="Create New Election">
      {/* Stepper */}
      <ol className="mb-8 flex flex-wrap items-center gap-2">
        {steps.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <li key={label} className="flex items-center gap-2">
              <button
                onClick={() => n < step && setStep(n)}
                className={
                  "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold " +
                  (active
                    ? "border-destructive bg-destructive text-destructive-foreground"
                    : done
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground")
                }
              >
                {n}
              </button>
              <span className={"text-sm " + (active ? "font-semibold text-foreground" : "text-muted-foreground")}>
                {label}
              </span>
              {n < steps.length && <span className="mx-1 text-border">—</span>}
            </li>
          );
        })}
      </ol>

      <div className="htu-card mx-auto max-w-3xl p-6 sm:p-8">
        {step === 1 && (
          <div className="space-y-4">
            <Field label="Election Title" required>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. COMPSSA Executive Elections 2026"
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </Field>
            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Voting Starts" required>
                <DateTimePicker
                  value={startAt}
                  onChange={setStartAt}
                  placeholder="Select start date & time"
                />
              </Field>
              <Field label="Voting Ends" required>
                <DateTimePicker
                  value={endAt}
                  onChange={setEndAt}
                  placeholder="Select end date & time"
                />
              </Field>
            </div>
            {(error || dateError) && (
              <div className="text-sm font-medium text-destructive mt-2">
                {error || dateError}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Add the positions being contested in this election.
            </p>
            {positions.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-2">
                <span className="w-6 text-sm text-muted-foreground">{idx + 1}.</span>
                <input
                  value={p.title}
                  onChange={(e) =>
                    setPositions(positions.map((q) => (q.id === p.id ? { ...q, title: e.target.value } : q)))
                  }
                  placeholder="e.g. President"
                  className="position-input flex-1 rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (idx === positions.length - 1 && p.title.trim() !== "") {
                        setPositions([
                          ...positions,
                          { id: "p" + rid(), title: "", countingMethod: "plurality", majorityFallback: "plurality" },
                        ]);
                        setTimeout(() => {
                          const inputs = document.querySelectorAll<HTMLInputElement>(".position-input");
                          if (inputs.length) inputs[inputs.length - 1].focus();
                        }, 10);
                      } else {
                        const inputs = document.querySelectorAll<HTMLInputElement>(".position-input");
                        if (inputs[idx + 1]) inputs[idx + 1].focus();
                      }
                    }
                  }}
                />
                <button
                  onClick={() => setPositions(positions.filter((q) => q.id !== p.id))}
                  disabled={positions.length === 1}
                  className="rounded-md border border-input p-2 text-muted-foreground hover:bg-surface hover:text-destructive disabled:opacity-40"
                  aria-label="Remove position"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                setPositions([
                  ...positions,
                  { id: "p" + rid(), title: "", countingMethod: "plurality", majorityFallback: "plurality" },
                ])
              }
              className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              <Plus className="h-4 w-4" /> Add position
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>This cannot be changed once voting opens.</span>
            </div>
            {positions.map((p) => (
              <div key={p.id} className="rounded-md border border-border bg-background p-4">
                <div className="mb-3 text-sm font-semibold text-foreground">{p.title || "Untitled position"}</div>
                <Field label="Counting Method">
                  <select
                    value={p.countingMethod}
                    onChange={(e) =>
                      setPositions(
                        positions.map((q) =>
                          q.id === p.id ? { ...q, countingMethod: e.target.value as CountingMethod } : q,
                        ),
                      )
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="plurality">Plurality (most votes wins)</option>
                    <option value="majority">Simple Majority (over 50% required)</option>
                  </select>
                </Field>
                {p.countingMethod === "majority" && (
                  <div className="mt-3">
                    <Field label="If no majority is reached">
                      <select
                        value={p.majorityFallback}
                        onChange={(e) =>
                          setPositions(
                            positions.map((q) =>
                              q.id === p.id ? { ...q, majorityFallback: e.target.value as MajorityFallback } : q,
                            ),
                          )
                        }
                        className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="runoff">Trigger Runoff</option>
                        <option value="plurality">Fall back to Plurality</option>
                      </select>
                    </Field>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 text-sm">
            <Row label="Title">{title}</Row>
            <Row label="Description">{description || <span className="text-muted-foreground">—</span>}</Row>
            <Row label="Voting Window">{formatDMY(startAt)} → {formatDMY(endAt)}</Row>
            <Row label="Positions">
              <ul className="list-disc space-y-1 pl-5">
                {positions.map((p) => (
                  <li key={p.id}>
                    <span className="font-medium">{p.title}</span> ·{" "}
                    <span className="text-muted-foreground">
                      {p.countingMethod === "plurality"
                        ? "Plurality"
                        : `Simple Majority (fallback: ${p.majorityFallback === "runoff" ? "Runoff" : "Plurality"})`}
                    </span>
                  </li>
                ))}
              </ul>
            </Row>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
          <SecondaryButton
            onClick={() => (step === 1 ? navigate({ to: "/admin/elections" }) : setStep(step - 1))}
          >
            {step === 1 ? "Cancel" : "Back"}
          </SecondaryButton>
          {step < 4 ? (
            <PrimaryButton disabled={!canNext} onClick={handleNext}>
              Continue
            </PrimaryButton>
          ) : (
            <PrimaryButton disabled={isPending} onClick={save}>
              {isPending ? "Creating..." : "Create Election"}
            </PrimaryButton>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border pb-3 sm:grid-cols-[160px_1fr]">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-foreground">{children}</div>
    </div>
  );
}

function formatDMY(dateString: string) {
  if (!dateString) return "Not set";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
