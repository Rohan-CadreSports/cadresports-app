"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => setStatus("success"),
    onError: (err) => { setError(err.message); setStatus("error"); },
  });

  useEffect(() => {
    if (token) {
      verifyMutation.mutate({ token });
    } else {
      setStatus("error");
      setError("No verification token provided");
    }
  }, [token]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px] text-center">
        <div className="bg-surface rounded-3xl shadow-[var(--shadow-lg)] border border-border-light p-8">
          <img src="/logo.png" alt="CadreSports" className="w-14 h-14 rounded-[10px] mx-auto mb-4" />

          {status === "loading" && (
            <>
              <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Verifying your email...</p>
            </>
          )}

          {status === "success" && (
            <>
              <h1 className="text-xl font-bold mb-2">Email verified</h1>
              <p className="text-sm text-muted-foreground mb-4">Your email has been verified successfully.</p>
              <Link href="/dashboard"><Button className="w-full">Go to Dashboard</Button></Link>
            </>
          )}

          {status === "error" && (
            <>
              <h1 className="text-xl font-bold mb-2">Verification failed</h1>
              <p className="text-sm text-red-500 mb-4">{error}</p>
              <Link href="/dashboard"><Button variant="outline" className="w-full">Go to Dashboard</Button></Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
