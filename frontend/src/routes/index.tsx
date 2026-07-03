import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { HowToVoteModal } from "@/components/HowToVoteModal";
import { VoterStepper } from "@/components/VoterStepper";
import { votingStore } from "@/lib/voting-store";
import { GoogleLogin } from "@react-oauth/google";
import { api } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Login — COMPSSA Secure Voting System" },
      {
        name: "description",
        content:
          "Secure voter login for Ho Technical University elections, currently running COMPSSA Elections.",
      },
    ],
  }),
  component: LoginPage,
});

// Real-time validation rules
const STUDENT_ID_RE = /^HTU\d{7}$/;
const TOKEN_RE = /^VOTE-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

type FieldState =
  | { kind: "empty" }
  | { kind: "invalid"; message: string }
  | { kind: "valid" };

function validateStudentId(raw: string): FieldState {
  const v = raw.trim().toUpperCase();
  if (!v) return { kind: "empty" };
  if (!v.startsWith("HTU"))
    return { kind: "invalid", message: "Student ID must start with HTU." };
  if (v.length < 10)
    return {
      kind: "invalid",
      message: `Add ${10 - v.length} more digit${10 - v.length === 1 ? "" : "s"} (format: HTU + 7 digits).`,
    };
  if (!STUDENT_ID_RE.test(v))
    return {
      kind: "invalid",
      message: "Use the format HTU followed by 7 digits (e.g. HTU2024001).",
    };
  return { kind: "valid" };
}

function validateToken(raw: string): FieldState {
  const v = raw.trim().toUpperCase();
  if (!v) return { kind: "empty" };
  if (!v.startsWith("VOTE-"))
    return { kind: "invalid", message: "Voting Token must start with VOTE-." };
  if (v.length < 14)
    return {
      kind: "invalid",
      message: "Token format is VOTE-XXXX-XXXX (letters and digits).",
    };
  if (!TOKEN_RE.test(v))
    return {
      kind: "invalid",
      message: "Use the format VOTE-XXXX-XXXX with letters or digits only.",
    };
  return { kind: "valid" };
}

function LoginPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [touchedToken, setTouchedToken] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const tokenState = useMemo(() => validateToken(token), [token]);
  const showTokenError = touchedToken && tokenState.kind === "invalid";
  const canSubmit = tokenState.kind === "valid";

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setTouchedToken(true);
    setServerError(null);
    if (!canSubmit) return;

    try {
      const res = await api.post("/auth/voter/login", {
        googleToken: credentialResponse.credential,
        token: token.trim().toUpperCase()
      });
      
      votingStore.login(res.data.accessToken);
      navigate({ to: "/ballot" });
    } catch (err: any) {
      setServerError(err.response?.data?.message || "Login failed. Please check your token or Google account.");
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-slate-900 relative">
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-70"
        style={{ backgroundImage: `url('/login-bg.jpg')` }} 
      />
      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-900/50 to-slate-900/80 pointer-events-none mix-blend-multiply" />

      <div className="relative z-10">
        <SiteHeader />
        <VoterStepper current="login" />
      </div>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-md">
          <div className="htu-card p-6 sm:p-8 bg-background/95 backdrop-blur-xl shadow-2xl border-white/20">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Voter Login</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the Voting Token issued by your Electoral Officer, then sign in with your student email.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                aria-label="Open How to Vote help dialog"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
                How to Vote
              </button>
            </div>

            <div className="space-y-6">
              <Field
                id="token"
                label="Voting Token"
                value={token}
                onChange={(v) => {
                  setToken(v);
                  if (serverError) setServerError(null);
                }}
                onBlur={() => setTouchedToken(true)}
                placeholder="VOTE-XXXX-XXXX"
                state={touchedToken ? tokenState : { kind: "empty" }}
                errorId="token-error"
                helpId="token-help"
                helpText="Single-use code issued by your Electoral Officer."
                mono
                autoCapitalize="characters"
              />

              {serverError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{serverError}</span>
                </div>
              )}

              <div className="pt-2">
                <div className={`transition-opacity ${!canSubmit ? 'opacity-50 pointer-events-none' : ''}`}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setServerError("Google Login failed")}
                    theme="outline"
                    size="large"
                    text="continue_with"
                    shape="pill"
                    width="100%"
                  />
                </div>
                {!canSubmit && (
                  <p className="text-[11px] text-center text-muted-foreground mt-2">
                    Enter a valid voting token to unlock sign-in.
                  </p>
                )}
              </div>
            </div>

            <p className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
              Having trouble? Contact your Electoral Officer.
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Ho Technical University · Secure Online Voting · Phase 1
          </p>
        </div>
      </main>
      <HowToVoteModal open={helpOpen} onClose={() => setHelpOpen(false)} context="login" />
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  state,
  errorId,
  helpId,
  helpText,
  mono = false,
  autoCapitalize,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder: string;
  state: FieldState;
  errorId: string;
  helpId: string;
  helpText: string;
  mono?: boolean;
  autoCapitalize?: string;
}) {
  const isInvalid = state.kind === "invalid";
  const isValid = state.kind === "valid";

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
        {label} <span className="text-destructive">*</span>
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          autoComplete="off"
          autoCapitalize={autoCapitalize}
          spellCheck={false}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          aria-invalid={isInvalid}
          aria-describedby={isInvalid ? errorId : helpId}
          className={
            "w-full rounded-md border bg-background px-3 py-2.5 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 " +
            (mono ? "font-mono tracking-wider placeholder:font-mono placeholder:tracking-wider " : "") +
            (isInvalid
              ? "border-destructive focus:border-destructive focus:ring-destructive/25"
              : isValid
                ? "border-success/60 focus:border-success focus:ring-success/25"
                : "border-input focus:border-primary focus:ring-primary/20")
          }
        />
        {isValid && (
          <CheckCircle2
            aria-hidden="true"
            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-success"
          />
        )}
        {isInvalid && (
          <AlertCircle
            aria-hidden="true"
            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive"
          />
        )}
      </div>
      {isInvalid ? (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-destructive"
        >
          <span>{state.message}</span>
        </p>
      ) : (
        <p id={helpId} className="mt-1.5 text-xs text-muted-foreground">
          {helpText}
        </p>
      )}
    </div>
  );
}
