import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, ShieldCheck, User, Cpu, Bell, KeyRound, Trash2 } from "lucide-react";
import { AdminShell, PrimaryButton, SecondaryButton, DangerButton } from "@/components/admin/AdminShell";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useAdminState } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — HTU Admin" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { admin } = useAdminState();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [auditAlerts, setAuditAlerts] = useState(true);
  const [resetOpen, setResetOpen] = useState(false);

  const resetDemo = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("htu-admin-state-v2");
      window.location.reload();
    }
  };

  return (
    <AdminShell title="Settings">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT: profile & organization */}
        <div className="space-y-6 lg:col-span-2">
          <SectionCard
            icon={<Building2 className="h-5 w-5" />}
            title="Organization"
            description="Institutional details displayed across the voter and admin experience."
          >
            <Row label="Institution" value="Ho Technical University" />
            <Row label="Active election body" value="COMPSSA — Computer Science Students Association" />
            <Row label="Brand colors" value={<BrandSwatches />} />
          </SectionCard>

          <SectionCard
            icon={<User className="h-5 w-5" />}
            title="Signed-in Officer"
            description="Your administrator profile for this session."
          >
            <Row label="Email" value={admin?.email ?? "—"} />
            <Row label="Role" value={<RoleBadge>Electoral Officer</RoleBadge>} />
            <Row
              label="Password"
              value={
                <div className="flex items-center gap-3">
                  <span className="font-mono text-muted-foreground">••••••••</span>
                  <SecondaryButton className="px-3 py-1.5 text-xs" disabled>
                    <KeyRound className="h-3.5 w-3.5" /> Change
                  </SecondaryButton>
                </div>
              }
            />
          </SectionCard>

          <SectionCard
            icon={<Bell className="h-5 w-5" />}
            title="Notifications"
            description="Choose what you'd like to be alerted about."
          >
            <ToggleRow
              label="Email summary on election close"
              description="A turnout and integrity snapshot the moment an election closes."
              checked={emailNotifs}
              onChange={setEmailNotifs}
            />
            <ToggleRow
              label="Audit-log anomaly alerts"
              description="Get notified when unusual administrative activity is detected."
              checked={auditAlerts}
              onChange={setAuditAlerts}
            />
          </SectionCard>
        </div>

        {/* RIGHT: system & danger */}
        <div className="space-y-6">
          <SectionCard
            icon={<Cpu className="h-5 w-5" />}
            title="System"
            description="Platform information."
            tone="muted"
          >
            <Row label="Application" value="COMPSSA Secure Online Voting System" />
            <Row label="Phase" value="Phase 2 — Admin Console" />
            <Row label="Build" value={<span className="font-mono text-xs">v0.3.0 · demo</span>} />
          </SectionCard>

          <SectionCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Security"
            description="Vote integrity protections in effect."
            tone="muted"
          >
            <CheckItem>End-to-end vote secrecy enforced</CheckItem>
            <CheckItem>Append-only audit log</CheckItem>
            <CheckItem>Voter tokens single-use & non-recoverable</CheckItem>
            <CheckItem>Counting rules locked once voting opens</CheckItem>
          </SectionCard>

          <div className="htu-card border-destructive/30 p-5">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-destructive/10 text-destructive">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-destructive">Danger Zone</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Reset all demo data — elections, voter rolls, candidates, and audit entries — back to the seed values.
            </p>
            <DangerButton className="mt-4 w-full" onClick={() => setResetOpen(true)}>
              Reset demo data
            </DangerButton>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={resetDemo}
        title="Reset all demo data?"
        description="This wipes the local session and reseeds the default elections, candidates, voters, and audit log. This action cannot be undone."
        confirmLabel="Reset everything"
        destructive
      />
    </AdminShell>
  );
}

function SectionCard({
  icon,
  title,
  description,
  tone = "primary",
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  tone?: "primary" | "muted";
  children: React.ReactNode;
}) {
  return (
    <section className="htu-card overflow-hidden">
      <header className="flex items-start gap-3 border-b border-border bg-surface/60 px-5 py-4">
        <div
          className={
            "grid h-9 w-9 place-items-center rounded-md " +
            (tone === "primary"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground")
          }
        >
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </header>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 px-5 py-4 sm:grid-cols-[200px_1fr] sm:items-center sm:gap-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 " +
          (checked ? "bg-primary" : "bg-muted")
        }
      >
        <span
          className={
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition " +
            (checked ? "translate-x-5" : "translate-x-0")
          }
        />
      </button>
    </div>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 px-5 py-3 text-sm text-foreground">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
      <span>{children}</span>
    </div>
  );
}

function RoleBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
      {children}
    </span>
  );
}

function BrandSwatches() {
  return (
    <div className="flex items-center gap-2">
      <Swatch hex="#1B4CA0" label="HTU Blue" />
      <Swatch hex="#D61F28" label="HTU Red" />
    </div>
  );
}

function Swatch({ hex, label }: { hex: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1">
      <span className="h-4 w-4 rounded-sm" style={{ background: hex }} />
      <span className="text-xs font-medium text-foreground">{label}</span>
      <span className="font-mono text-[10px] text-muted-foreground">{hex}</span>
    </div>
  );
}
