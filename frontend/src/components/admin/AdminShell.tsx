import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutGrid,
  Users,
  ClipboardList,
  Settings as SettingsIcon,
  ScrollText,
  LogOut,
} from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { adminStore, useAdminState } from "@/lib/admin-store";

const nav = [
  { to: "/admin/elections", label: "Elections", icon: LayoutGrid },
];

export function AdminShell({ children, title, actions }: { children: ReactNode; title: string; actions?: ReactNode }) {
  const navigate = useNavigate();
  const { user, logout: handleLogout } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const logout = () => {
    handleLogout();
    navigate({ to: "/admin-login" });
  };

  return (
    <div className="flex h-dvh bg-surface overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-primary text-primary-foreground lg:flex">
        <div className="flex flex-col items-center gap-2 border-b border-white/10 px-4 py-5 text-center">
          <div className="rounded-md bg-white p-2">
            <img src="/htu_logo.png" alt="HTU crest" className="h-12 w-auto" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
              Admin Console
            </p>
            <p className="text-sm font-semibold">COMPSSA Secure Voting</p>
          </div>
          <div className="mt-1 flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1">
            <img src="/compssa_logo.jpg" alt="COMPSSA" className="h-5 w-5 rounded-sm object-contain" />
            <span className="text-[11px] font-medium text-white/90">COMPSSA Elections</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {nav.map((n) => {
            const active = pathname === n.to || pathname.startsWith(n.to + "/");
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors " +
                  (active
                    ? "bg-white/15 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white")
                }
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
          
          {user?.role === 'super_admin' && (
            <>
              <div className="mt-4 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-white/50">
                Super Admin
              </div>
              <Link
                to="/admin/officials"
                className={
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors " +
                  (pathname.startsWith("/admin/officials")
                    ? "bg-white/15 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white")
                }
              >
                <Users className="h-4 w-4" />
                EC Officials
              </Link>
              <Link
                to="/admin/audit-logs"
                className={
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors " +
                  (pathname.startsWith("/admin/audit-logs")
                    ? "bg-white/15 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white")
                }
              >
                <ScrollText className="h-4 w-4" />
                Audit Logs
              </Link>
            </>
          )}
        </nav>

        <div className="border-t border-white/10 px-3 py-3">
          <div className="mb-2 px-2 text-xs text-white/70 truncate">{user?.email ?? ""}</div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4 py-3 sm:px-6">
          <div className="min-w-0 lg:hidden flex items-center gap-2">
            <img src="/htu_logo.png" alt="" className="h-8 w-auto" />
            <span className="truncate text-sm font-semibold">HTU Admin</span>
          </div>
          <h1 className="hidden truncate text-lg font-semibold text-foreground lg:block">
            {title}
          </h1>
          <div className="flex items-center gap-2">{actions}</div>
        </header>
        <h1 className="shrink-0 border-b border-border bg-background px-4 py-3 text-base font-semibold text-foreground lg:hidden">
          {title}
        </h1>
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 pb-32 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-muted text-muted-foreground border-border",
    open: "bg-success/10 text-success border-success/30",
    closed: "bg-destructive/10 text-destructive border-destructive/30",
    results_published: "bg-primary/10 text-primary border-primary/30",
  };
  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium " +
        (styles[status] ?? styles.Draft)
      }
    >
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
}

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={
        "inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-[oklch(0.40_0.17_258)] disabled:cursor-not-allowed disabled:opacity-50 " +
        className
      }
    />
  );
}

export function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={
        "inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50 " +
        className
      }
    />
  );
}

export function DangerButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={
        "inline-flex items-center justify-center gap-2 rounded-md border border-destructive/30 bg-background px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/5 " +
        className
      }
    />
  );
}
