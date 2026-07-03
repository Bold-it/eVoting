

interface Props {
  compact?: boolean;
}

export function SiteHeader({ compact = false }: Props) {
  return (
    <header className="w-full border-b border-border bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <img
          src="/htu_logo.png"
          alt="Ho Technical University crest"
          className={compact ? "h-10 w-auto" : "h-14 w-auto sm:h-16"}
        />

        <div className="min-w-0 flex-1 px-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary sm:text-xs">
            COMPSSA Elections
          </p>
          <h1
            className={
              "truncate font-semibold text-foreground " +
              (compact ? "text-sm sm:text-base" : "text-base sm:text-lg")
            }
          >
            COMPSSA Secure Voting System
          </h1>
        </div>

        <img
          src="/compssa_logo.jpg"
          alt="COMPSSA — Computer Science Students Association"
          className={
            "rounded-md object-contain " +
            (compact ? "h-10 w-10" : "h-12 w-12 sm:h-14 sm:w-14")
          }
        />
      </div>
      <div className="h-[2px] w-full bg-gradient-to-r from-primary via-primary to-destructive/70" />
    </header>
  );
}
