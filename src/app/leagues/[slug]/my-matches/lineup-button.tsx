"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";

interface Match {
  id: string;
  matchNumber: number;
  format: string;
  status: string;
}

interface Player {
  id: string;
  name: string;
}

export function LineupButton({
  tieId,
  teamId,
  matches,
  roster,
  sportSlug,
  matchConfig,
}: {
  tieId: string;
  teamId: string;
  matches: Match[];
  roster: Player[];
  sportSlug: string;
  matchConfig: Record<string, number>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [footballSelected, setFootballSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitLineup = trpc.team.submitLineup.useMutation({
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

  const isFootball = sportSlug === "football";
  const playersPerSide = matchConfig?.playersPerSide || 11;

  if (!open) {
    return (
      <Button size="sm" className="w-full mt-2" onClick={() => setOpen(true)}>
        {isFootball ? "Select Starting Lineup" : "Submit Lineup"}
      </Button>
    );
  }

  function handleSubmit() {
    if (isFootball) {
      if (footballSelected.length < playersPerSide) {
        setError(`Select at least ${playersPerSide} players`);
        return;
      }
      const match = matches[0];
      if (!match) { setError("No match found"); return; }

      setLoading(true);
      setError("");
      submitLineup.mutate({
        tieId,
        teamId,
        entries: [{ matchId: match.id, playerIds: footballSelected }],
      });
    } else {
      const entries = matches.map((m) => ({
        matchId: m.id,
        playerIds: selections[m.id] || [],
      }));

      const incomplete = entries.find((e) => {
        const match = matches.find((m) => m.id === e.matchId);
        if (match?.format === "DOUBLES") return e.playerIds.length < 2;
        return e.playerIds.length < 1;
      });

      if (incomplete) {
        const match = matches.find((m) => m.id === incomplete.matchId);
        setError(`Assign player(s) for ${match?.format === "SINGLES" ? "Singles" : "Doubles"} ${match?.matchNumber}`);
        return;
      }

      setLoading(true);
      setError("");
      submitLineup.mutate({ tieId, teamId, entries });
    }
  }

  function toggleFootballPlayer(playerId: string) {
    setFootballSelected((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-border-light space-y-3">
      {isFootball ? (
        <>
          <p className="text-sm font-medium">
            Select starting {playersPerSide} ({footballSelected.length}/{playersPerSide})
          </p>
          <div className="space-y-1.5">
            {roster.map((player) => {
              const selected = footballSelected.includes(player.id);
              return (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => toggleFootballPlayer(player.id)}
                  className={`w-full text-left py-2.5 px-3 rounded-[8px] text-sm transition-all duration-150 ${
                    selected
                      ? "bg-brand/10 border border-brand/30 font-medium"
                      : "bg-muted/50 border border-transparent hover:bg-muted"
                  }`}
                >
                  {player.name}
                  {selected && <span className="float-right text-brand font-bold">✓</span>}
                </button>
              );
            })}
          </div>
          {footballSelected.length < playersPerSide && (
            <p className="text-xs text-muted-foreground">
              Select {playersPerSide - footballSelected.length} more
            </p>
          )}
        </>
      ) : (
        <>
          <p className="text-sm font-medium">Assign players for each match:</p>
          {matches.map((match) => {
            const isDoubles = match.format === "DOUBLES";
            const selected = selections[match.id] || [];

            return (
              <div key={match.id} className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">
                  {isDoubles ? "Doubles" : "Singles"} {match.matchNumber}
                </p>
                <select
                  className="w-full h-9 px-3 rounded-[8px] border border-border bg-surface text-sm"
                  value={selected[0] || ""}
                  onChange={(e) => {
                    setSelections({
                      ...selections,
                      [match.id]: [e.target.value, ...(isDoubles ? selected.slice(1) : [])],
                    });
                  }}
                >
                  <option value="">{isDoubles ? "Player 1..." : "Select player..."}</option>
                  {roster.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {isDoubles && (
                  <select
                    className="w-full h-9 px-3 rounded-[8px] border border-border bg-surface text-sm"
                    value={selected[1] || ""}
                    onChange={(e) => {
                      setSelections({
                        ...selections,
                        [match.id]: [selected[0] || "", e.target.value],
                      });
                    }}
                  >
                    <option value="">Player 2...</option>
                    {roster.filter((p) => p.id !== selected[0]).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <Button variant="ghost" size="sm" className="flex-1" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button size="sm" className="flex-1" loading={loading} onClick={handleSubmit}>
          Confirm Lineup
        </Button>
      </div>
    </div>
  );
}
