"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc/client";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export function RegisterButton({
  leagueId,
  isLoggedIn,
  alreadyRegistered,
  registrationStatus,
}: {
  leagueId: string;
  isLoggedIn: boolean;
  alreadyRegistered: boolean;
  registrationStatus?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const registerMutation = trpc.registration.register.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setLoading(false);
      router.refresh();
    },
    onError: (err) => {
      setError(err.message);
      setLoading(false);
    },
  });

  if (!isLoggedIn) {
    const signinUrl = `/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`;
    const signupUrl = `/auth/register?callbackUrl=${encodeURIComponent(pathname)}`;

    return (
      <div className="space-y-2">
        <Link href={signinUrl}>
          <Button className="w-full" size="lg">Sign in to Register</Button>
        </Link>
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href={signupUrl} className="text-brand font-medium">Sign up</Link>
        </p>
      </div>
    );
  }

  if (alreadyRegistered) {
    return (
      <div className="flex items-center gap-2 p-4 bg-muted rounded-2xl">
        <span className="text-sm font-medium">Registration Status:</span>
        <Badge
          variant={
            registrationStatus === "APPROVED" ? "success" :
            registrationStatus === "PENDING" ? "warning" :
            "danger"
          }
        >
          {registrationStatus}
        </Badge>
      </div>
    );
  }

  if (success) {
    return (
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
        <p className="text-sm font-semibold text-emerald-700">Registration submitted!</p>
        <p className="text-xs text-emerald-600 mt-0.5">Waiting for approval from the tournament operator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        className="w-full"
        size="lg"
        loading={loading}
        onClick={() => {
          setLoading(true);
          setError("");
          registerMutation.mutate({ leagueId });
        }}
      >
        Register for this League
      </Button>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl p-3">{error}</p>
      )}
    </div>
  );
}
