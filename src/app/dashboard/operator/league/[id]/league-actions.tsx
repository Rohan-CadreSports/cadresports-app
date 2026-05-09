"use client";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUS_FLOW: Record<string, { next: string; label: string; variant: "primary" | "secondary" | "danger" }[]> = {
  DRAFT: [
    { next: "REGISTRATION_OPEN", label: "Open Registration", variant: "primary" },
    { next: "CANCELLED", label: "Cancel", variant: "danger" },
  ],
  REGISTRATION_OPEN: [
    { next: "REGISTRATION_CLOSED", label: "Close Registration", variant: "secondary" },
    { next: "CANCELLED", label: "Cancel", variant: "danger" },
  ],
  REGISTRATION_CLOSED: [
    { next: "IN_PROGRESS", label: "Start League", variant: "primary" },
    { next: "REGISTRATION_OPEN", label: "Reopen Registration", variant: "secondary" },
  ],
  IN_PROGRESS: [{ next: "COMPLETED", label: "Mark Completed", variant: "secondary" }],
  COMPLETED: [],
  CANCELLED: [],
};

export function LeagueActions({
  leagueId,
  currentStatus,
}: {
  leagueId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateStatus = trpc.league.updateStatus.useMutation({
    onSuccess: () => {
      router.refresh();
      setLoading(false);
      setError("");
    },
    onError: (err) => {
      setError(err.message);
      setLoading(false);
    },
  });

  const actions = STATUS_FLOW[currentStatus] || [];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.next}
            variant={action.variant}
            size="sm"
            loading={loading}
            onClick={() => {
              if (action.variant === "danger" && !confirm("Are you sure? This action cannot be undone.")) {
                return;
              }
              setLoading(true);
              setError("");
              updateStatus.mutate({
                leagueId,
                status: action.next as "DRAFT" | "REGISTRATION_OPEN" | "REGISTRATION_CLOSED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
              });
            }}
          >
            {action.label}
          </Button>
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
