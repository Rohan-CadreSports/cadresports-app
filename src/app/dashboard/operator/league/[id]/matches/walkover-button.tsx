"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";

export function WalkoverButton({
  tieId,
  homeTeam,
  awayTeam,
}: {
  tieId: string;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [forfeitTeamId, setForfeitTeamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const walkoverMutation = trpc.match.walkover.useMutation({
    onSuccess: () => {
      router.refresh();
      setOpen(false);
      setLoading(false);
    },
    onError: (err) => {
      setError(err.message);
      setLoading(false);
    },
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-red-500 font-medium hover:underline mt-2"
      >
        Mark Walkover
      </button>
    );
  }

  return (
    <div className="mt-2 pt-2 border-t border-border space-y-2">
      <Select
        label="Which team forfeited?"
        placeholder="Select team"
        options={[
          { value: homeTeam.id, label: homeTeam.name },
          { value: awayTeam.id, label: awayTeam.name },
        ]}
        value={forfeitTeamId}
        onChange={(e) => setForfeitTeamId(e.target.value)}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-1.5">
        <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button
          variant="danger"
          size="sm"
          className="flex-1 text-xs"
          loading={loading}
          onClick={() => {
            if (!forfeitTeamId) {
              setError("Select the forfeiting team");
              return;
            }
            if (!confirm("Are you sure? This awards all match points to the other team.")) return;
            setLoading(true);
            setError("");
            walkoverMutation.mutate({ tieId, forfeitingTeamId: forfeitTeamId });
          }}
        >
          Confirm Walkover
        </Button>
      </div>
    </div>
  );
}
