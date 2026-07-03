import { useEffect, useState } from "react";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(open), [open]);
  if (!open && !mounted) return null;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-elevated">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={
              "rounded-md px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm " +
              (destructive ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-[oklch(0.40_0.17_258)]")
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
