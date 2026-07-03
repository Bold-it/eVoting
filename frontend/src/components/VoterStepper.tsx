import { Check } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export type VoterStep = "login" | "ballot" | "confirm" | "receipt";


const STEPS: { id: VoterStep; label: string; short: string }[] = [
  { id: "login", label: "Sign In", short: "Sign In" },
  { id: "ballot", label: "Cast Ballot", short: "Ballot" },
  { id: "confirm", label: "Review", short: "Review" },
  { id: "receipt", label: "Receipt", short: "Receipt" },
];

interface Props {
  current: VoterStep;
  className?: string;
}

export function VoterStepper({ current, className = "" }: Props) {
  const activeIndex = STEPS.findIndex((s) => s.id === current);
  const reducedMotion = usePrefersReducedMotion();
  const stepTransition = reducedMotion ? "" : "transition-colors";
  const lineTransition = reducedMotion ? "" : "transition-colors";

  return (
    <nav
      aria-label="Voting progress"
      className={
        "border-b border-border bg-background/80 backdrop-blur-sm " + className
      }
    >
      <ol className="mx-auto flex w-full max-w-3xl items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6">
        {STEPS.map((step, i) => {
          const isComplete = i < activeIndex;
          const isActive = i === activeIndex;
          const state = isComplete ? "complete" : isActive ? "current" : "upcoming";

          return (
            <li key={step.id} className="flex flex-1 items-center gap-2 sm:gap-3">
              <div
                className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5"
                aria-current={isActive ? "step" : undefined}
              >
                <span
                  aria-hidden="true"
                  className={
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold sm:h-8 sm:w-8 " +
                    stepTransition + " " +
                    (state === "complete"
                      ? "bg-primary text-primary-foreground"
                      : state === "current"
                        ? "border-2 border-primary bg-primary/10 text-primary"
                        : "border border-border bg-background text-muted-foreground")
                  }
                >
                  {state === "complete" ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : i + 1}
                </span>
                <span
                  className={
                    "truncate text-xs font-medium sm:text-sm " +
                    (state === "current"
                      ? "text-primary"
                      : state === "complete"
                        ? "text-foreground"
                        : "text-muted-foreground")
                  }
                >
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.short}</span>
                </span>
                <span className="sr-only">
                  {state === "complete"
                    ? "Completed"
                    : state === "current"
                      ? "Current step"
                      : "Upcoming"}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={
                    "h-px flex-1 " +
                    lineTransition + " " +
                    (isComplete ? "bg-primary" : "bg-border")
                  }
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
