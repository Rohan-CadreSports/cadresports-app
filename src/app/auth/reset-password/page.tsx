"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetPassword = trpc.auth.resetPassword.useMutation({
    onSuccess: () => { setDone(true); setLoading(false); },
    onError: (err) => { setError(err.message); setLoading(false); },
  });

  if (!token) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Invalid link</h1>
          <p className="text-sm text-muted-foreground mb-4">This reset link is invalid or has expired.</p>
          <Link href="/auth/forgot-password"><Button>Request New Link</Button></Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-[400px] text-center">
          <div className="bg-surface rounded-3xl shadow-[var(--shadow-lg)] border border-border-light p-8">
            <img src="/logo.png" alt="CadreSports" className="w-14 h-14 rounded-[10px] mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Password updated</h1>
            <p className="text-sm text-muted-foreground mb-4">You can now sign in with your new password.</p>
            <Link href="/auth/signin"><Button className="w-full">Sign In</Button></Link>
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
            <h1 className="text-xl font-bold">Set new password</h1>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-[10px]">{error}</p>}

          <form onSubmit={(e) => {
            e.preventDefault();
            if (password !== confirm) { setError("Passwords do not match"); return; }
            if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
            setLoading(true);
            setError("");
            resetPassword.mutate({ token, newPassword: password });
          }} className="space-y-4">
            <Input id="password" label="New Password" type="password" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            <Input id="confirm" label="Confirm Password" type="password" placeholder="Re-enter password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            {password && confirm && password !== confirm && (
              <p className="text-sm text-red-500">Passwords do not match</p>
            )}
            <Button type="submit" className="w-full h-12" loading={loading}>Update Password</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
