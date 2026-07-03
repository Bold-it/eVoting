import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { VoterStepper } from "@/components/VoterStepper";
import { useVotingState, votingStore } from "@/lib/voting-store";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import forge from "node-forge";
import { useState } from "react";
import { AlertCircle } from "lucide-react";

export const Route = createFileRoute("/confirm")({
  head: () => ({ meta: [{ title: "Confirm — COMPSSA Secure Voting System" }] }),
  component: ConfirmPage,
});

function ConfirmPage() {
  const navigate = useNavigate();
  const state = useVotingState();
  const { data: election } = useQuery({
    queryKey: ["voterBallot"],
    queryFn: async () => {
      const res = await api.get("/voter/ballot");
      return res.data;
    },
    enabled: !!state.accessToken,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!state.accessToken) navigate({ to: "/" });
  }, [state.accessToken, navigate]);

  const submit = async () => {
    if (!election?.publicKey) return alert("Security Error: Election public key not found.");
    setIsSubmitting(true);
    
    try {
      // 1. Prepare JSON Payload
      const payloadString = JSON.stringify(state.selections);
      
      // 2. Generate random 32-byte AES key and 16-byte IV (CBC requires 16 bytes)
      const aesKey = forge.random.getBytesSync(32);
      const iv = forge.random.getBytesSync(16);
      
      // 3. Encrypt payload with AES-CBC
      const cipher = forge.cipher.createCipher('AES-CBC', aesKey);
      cipher.start({ iv: iv });
      cipher.update(forge.util.createBuffer(payloadString, 'utf8'));
      cipher.finish();
      
      const encryptedPayloadBase64 = forge.util.encode64(cipher.output.getBytes());
      const ivBase64 = forge.util.encode64(iv);
      
      // 4. Encrypt AES key with Election RSA Public Key
      const publicKey = forge.pki.publicKeyFromPem(election.publicKey);
      const encryptedKeyBytes = publicKey.encrypt(aesKey, 'RSA-OAEP', {
        md: forge.md.sha1.create()
      });
      const encryptedKeyBase64 = forge.util.encode64(encryptedKeyBytes);
      
      // 5. Send to Backend
      await api.post('/voter/vote', {
        encryptedPayload: encryptedPayloadBase64,
        encryptedKey: encryptedKeyBase64,
        iv: ivBase64
      });
      
      // 6. Generate Receipt Code based on transaction hash
      const receiptHash = forge.md.sha256.create().update(encryptedPayloadBase64).digest().toHex();
      const receiptCode = "HTU-" + receiptHash.slice(0, 8).toUpperCase();
      
      votingStore.setReceiptCode(receiptCode);
      navigate({ to: "/receipt" });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Failed to cast vote. It may have already been submitted.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
        <SiteHeader compact />
        <VoterStepper current="confirm" />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Review your ballot</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Please confirm your selections below. Once submitted, your ballot cannot be changed.
          </p>
        </div>

        {errorMsg && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-6 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">Submission Failed</p>
              <p className="mt-1 text-destructive/90">{errorMsg}</p>
            </div>
          </div>
        )}

        <div className="htu-card overflow-hidden">
          <ul className="divide-y divide-border">
            {election?.Positions?.map((p: any) => {
              const sel = state.selections[p.id];
              const cand = p.Candidates?.find((c: any) => c.id === sel);
              return (
                <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {p.name}
                    </p>
                    <p className="mt-0.5 truncate font-medium text-foreground">
                      {cand ? cand.name : sel === "ABSTAIN" ? "Abstained" : "No selection"}
                    </p>
                  </div>
                  {cand?.photoUrl && (
                    <img
                      src={cand.photoUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-full border border-border object-cover"
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-6 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3">
          <p className="text-sm font-medium text-destructive">
            Warning: Submitting your vote is final and irreversible.
          </p>
          <p className="mt-0.5 text-sm text-destructive/90">
            You will not be able to log in again or change any selection.
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => navigate({ to: "/ballot" })}
            className="rounded-md border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            Go Back to Edit
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={isSubmitting}
            className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-[oklch(0.40_0.17_258)] disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? "Encrypting & Submitting..." : "Submit Secure Vote"}
          </button>
        </div>
      </main>
    </div>
  );
}
