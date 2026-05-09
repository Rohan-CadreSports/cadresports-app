"use client";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Zap } from "lucide-react";

export function GenerateNextRoundButton({
  leagueId,
  divisionId,
}: {
  leagueId: string;
  divisionId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateMutation = trpc.league.generateNextRound.useMutation({
    onSuccess: (result) => {
      router.refresh();
      setLoading(false);
      setError("");
    },
    onError: (err) => {
      setError(err.message);
      setLoading(false);
    },
  });

  return (
    <div className="space-y-1">
      <Button
        size="sm"
        loading={loading}
        onClick={() => {
          setLoading(true);
          setError("");
          generateMutation.mutate({ leagueId, divisionId });
        }}
      >
        <Zap className="w-4 h-4 mr-1.5" />
        Generate Next Round
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
