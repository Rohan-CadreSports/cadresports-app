"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";

export default function LineupPage() {
  const router = useRouter();
  const params = useParams();
  const tieId = params.tieId as string;

  const { data: tieData, isLoading } = trpc.match.getTieDetail.useQuery({ tieId });
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const submitLineup = trpc.team.submitLineup.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => router.back(), 1500);
    },
    onError: (err) => {
      setError(err.message);
      setLoading(false);
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-sm mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded-xl w-48" />
          <div className="h-32 bg-muted rounded-2xl" />
          <div className="h-32 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!tieData) {
    return (
      <div className="max-w-sm mx-auto px-4 py-6 text-center">
        <p className="text-muted-foreground">Tie not found</p>
      </div>
    );
  }

  const { tie, myTeam, roster, matches } = tieData;

  if (!myTeam) {
    return (
      <div className="max-w-sm mx-auto px-4 py-6 text-center">
        <p className="text-muted-foreground">You are not a captain for any team in this tie</p>
      </div>
    );
  }

  const playerOptions = roster.map((p) => ({ value: p.id, label: p.name }));

  function handleSubmit() {
    const entries = matches.map((m) => ({
      matchId: m.id,
      playerIds: selections[m.id] || [],
    }));

    // Validate all matches have players assigned
    const incomplete = entries.find((e) =>
      e.playerIds.length === 0 ||
      (matches.find((m) => m.id === e.matchId)?.format === "DOUBLES" && e.playerIds.length < 2)
    );

    if (incomplete) {
      const match = matches.find((m) => m.id === incomplete.matchId);
      setError(`Please assign player(s) for ${match?.format === "SINGLES" ? "Singles" : "Doubles"} ${match?.matchNumber}`);
      return;
    }

    setLoading(true);
    setError("");
    submitLineup.mutate({
      tieId,
      teamId: myTeam!.id,
      entries,
    });
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Submit Lineup</h1>
          <p className="text-sm text-muted-foreground">
            {tie.homeTeamName} vs {tie.awayTeamName} &middot; R{tie.round}
          </p>
        </div>
      </div>

      <Card className="bg-brand/5 border-brand/20">
        <p className="text-sm font-medium text-brand">Your Team: {myTeam.name}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Assign players for each match. Same player can play singles and doubles.
        </p>
      </Card>

      {success && (
        <div className="bg-green-50 text-green-700 text-sm p-3 rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4" /> Lineup submitted! Redirecting...
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{error}</div>
      )}

      <div className="space-y-3">
        {matches.map((match) => {
          const isDoubles = match.format === "DOUBLES";
          return (
            <Card key={match.id}>
              <CardTitle className="text-sm mb-3">
                {isDoubles ? "Doubles" : "Singles"} {match.matchNumber}
              </CardTitle>
              <Select
                label={isDoubles ? "Player 1" : "Player"}
                placeholder="Select player"
                options={playerOptions}
                value={selections[match.id]?.[0] || ""}
                onChange={(e) => {
                  const current = selections[match.id] || [];
                  setSelections({
                    ...selections,
                    [match.id]: [e.target.value, ...(isDoubles ? current.slice(1) : [])],
                  });
                }}
              />
              {isDoubles && (
                <div className="mt-2">
                  <Select
                    label="Player 2"
                    placeholder="Select partner"
                    options={playerOptions.filter((p) => p.value !== selections[match.id]?.[0])}
                    value={selections[match.id]?.[1] || ""}
                    onChange={(e) => {
                      const current = selections[match.id] || [];
                      setSelections({
                        ...selections,
                        [match.id]: [current[0] || "", e.target.value],
                      });
                    }}
                  />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Button className="w-full" size="lg" loading={loading} onClick={handleSubmit} disabled={success}>
        Submit Lineup
      </Button>
    </div>
  );
}
