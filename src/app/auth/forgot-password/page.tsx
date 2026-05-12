"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestReset = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => { setSent(true); setLoading(false); },
    onError: (err) => { setError(err.message); setLoading(false); },
  });

  if (sent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-[400px] text-center">
          <div className="bg-surface rounded-3xl shadow-[var(--shadow-lg)] border border-border-light p-8">
            <img src="/logo.png" alt="CadreSports" className="w-14 h-14 rounded-[10px] mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Check your email</h1>
            <p className="text-sm text-muted-foreground mb-4">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link.
            </p>
            <Link href="/auth/signin">
              <Button variant="outline" className="w-full">Back to Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="bg-surface rounded-3xl shadow-[var(--shadow-lg)] border border-border-light p-8 space-y-5">
          <div className="text-center">
            <img src="/logo.png" alt="CadreSports" className="w-14 h-14 rounded-[10px] mx-auto mb-4" />
            <h1 className="text-xl font-bold">Forgot password?</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your email and we&apos;ll send a reset link</p>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-[10px]">{error}</p>}

          <form onSubmit={(e) => {
            e.preventDefault();
            setLoading(true);
            setError("");
            requestReset.mutate({ email });
          }} className="space-y-4">
            <Input id="email" label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Button type="submit" className="w-full h-12" loading={loading}>Send Reset Link</Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/auth/signin" className="text-brand font-medium">Back to Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
