import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { adminStore } from "@/lib/admin-store";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/admin-login")({
  head: () => ({ meta: [{ title: "Admin Login — COMPSSA Secure Voting" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [googleCredential, setGoogleCredential] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setError(null);
      setMessage("Verifying your Google account...");

      const cred = credentialResponse.credential;

      const res = await fetch("http://localhost:3000/auth/admin/request-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleToken: cred })
      });

      const data = await res.json();

      if (!res.ok) {
        // Surface the exact message from the backend
        const msg = data?.message || data?.error || `Server error ${res.status}`;
        throw new Error(Array.isArray(msg) ? msg.join('. ') : msg);
      }

      setGoogleCredential(cred);
      setMessage(data.message || "Token sent! Check your email.");
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Google Login failed. Check the backend terminal for details.");
      setMessage(null);
    }
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken.trim() || !googleCredential) return;
    
    try {
      setError(null);
      await login(googleCredential, adminToken.trim());
      navigate({ to: "/admin/elections" });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Login failed. Invalid token.";
      setError(Array.isArray(msg) ? msg.join('. ') : msg);
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

      <header className="relative z-10 w-full border-b border-white/10 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <img src="/htu_logo.png" alt="HTU crest" className="h-14 w-auto" />
          <div className="min-w-0 flex-1 px-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              Admin Console
            </p>
            <h1 className="truncate text-sm font-bold text-foreground sm:text-base">
              COMPSSA Secure Voting System
            </h1>
          </div>
          <img src="/compssa_logo.jpg" alt="COMPSSA" className="h-12 w-12 rounded-md object-contain" />
        </div>
        <div className="h-[2px] w-full bg-gradient-to-r from-primary via-primary to-destructive/70" />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-md">
          <div className="htu-card p-6 sm:p-8 bg-background/95 backdrop-blur-xl shadow-2xl border-white/20">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Electoral Officer Sign In</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Restricted access. Authorized administrators only.
            </p>

            {step === 1 ? (
              <div className="mt-8 mb-4 flex flex-col items-center gap-4">
                <p className="text-sm text-foreground mb-2 text-center">Step 1: Authenticate to receive your login token via email.</p>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google Login failed")}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="pill"
                />
              </div>
            ) : (
              <form onSubmit={handleTokenSubmit} className="mt-6">
                <label htmlFor="adminToken" className="block text-sm font-medium text-foreground">
                  Enter Admin Token
                </label>
                <div className="mt-2">
                  <input
                    id="adminToken"
                    type="text"
                    required
                    placeholder="e.g. ADMIN-XXXX-XXXX"
                    className="htu-input w-full uppercase"
                    value={adminToken}
                    onChange={(e) => setAdminToken(e.target.value)}
                  />
                </div>
                <button type="submit" className="htu-btn-primary w-full mt-4">
                  Verify & Login
                </button>
                <button 
                  type="button" 
                  onClick={() => { setStep(1); setGoogleCredential(null); setMessage(null); setError(null); }}
                  className="mt-4 text-xs text-muted-foreground hover:text-foreground text-center w-full"
                >
                  &larr; Go back to Google Auth
                </button>
              </form>
            )}

            {message && (
              <div role="status" className="mt-4 rounded-md border border-primary/40 bg-primary/5 px-3 py-2.5 text-sm text-primary">
                {message}
              </div>
            )}
            
            {error && (
              <div role="alert" className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            <p className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">
              Only @htu.edu.gh accounts are permitted.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
