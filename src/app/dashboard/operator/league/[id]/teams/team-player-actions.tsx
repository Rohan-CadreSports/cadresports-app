"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, UserMinus, Trash2, Crown } from "lucide-react";

interface Team {
  id: string;
  name: string;
}

export function PlayerActions({
  playerId,
  playerName,
  teamId,
  isCaptain,
  allTeams,
  leagueId,
}: {
  playerId: string;
  playerName: string;
  teamId: string;
  isCaptain: boolean;
  allTeams: Team[];
  leagueId: string;
}) {
  const router = useRouter();
  const [showMove, setShowMove] = useState(false);
  const [moveToTeamId, setMoveToTeamId] = useState("");

  const removeMutation = trpc.team.removePlayer.useMutation({ onSuccess: () => router.refresh() });
  const moveMutation = trpc.team.movePlayer.useMutation({ onSuccess: () => { router.refresh(); setShowMove(false); } });
  const removeFromLeague = trpc.team.removeFromLeague.useMutation({ onSuccess: () => router.refresh() });
  const makeCaptain = trpc.team.changeCaptain.useMutation({ onSuccess: () => router.refresh() });

  const isPending = removeMutation.isPending || moveMutation.isPending || removeFromLeague.isPending || makeCaptain.isPending;
  const otherTeams = allTeams.filter((t) => t.id !== teamId);

  if (showMove) {
    return (
      <div className="flex items-center gap-1.5 ml-auto">
        <select
          className="h-7 px-2 text-xs rounded-lg border border-border bg-white"
          value={moveToTeamId}
          onChange={(e) => setMoveToTeamId(e.target.value)}
        >
          <option value="">Move to...</option>
          {otherTeams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-brand"
          onClick={() => { if (moveToTeamId) moveMutation.mutate({ playerId, fromTeamId: teamId, toTeamId: moveToTeamId }); }}
          disabled={!moveToTeamId || isPending}>Move</Button>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground"
          onClick={() => setShowMove(false)}>Cancel</Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 ml-auto">
      {/* Make Captain */}
      {!isCaptain && (
        <button
          onClick={() => {
            if (confirm(`Make ${playerName} the captain of this team?`))
              makeCaptain.mutate({ teamId, newCaptainId: playerId });
          }}
          className="p-1.5 text-muted-foreground hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
          title="Make Captain"
          disabled={isPending}
        >
          <Crown className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Move */}
      {otherTeams.length > 0 && !isCaptain && (
        <button onClick={() => setShowMove(true)}
          className="p-1.5 text-muted-foreground hover:text-brand hover:bg-brand/5 rounded-lg transition-colors"
          title="Move to another team" disabled={isPending}>
          <ArrowRightLeft className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Remove from team */}
      {!isCaptain && (
        <button
          onClick={() => { if (confirm(`Remove ${playerName} from this team?`)) removeMutation.mutate({ teamId, playerId }); }}
          className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Remove from team" disabled={isPending}>
          <UserMinus className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Remove from league */}
      <button
        onClick={() => {
          if (confirm(`Remove ${playerName} from the entire league? This rejects their registration.`))
            removeFromLeague.mutate({ playerId, leagueId });
        }}
        className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Remove from league" disabled={isPending}>
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function DeleteTeamButton({ teamId, teamName }: { teamId: string; teamName: string }) {
  const router = useRouter();
  const deleteMutation = trpc.team.deleteTeam.useMutation({ onSuccess: () => router.refresh() });

  return (
    <button
      onClick={() => { if (confirm(`Delete team "${teamName}"? All players will be unassigned.`)) deleteMutation.mutate({ teamId }); }}
      className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      title="Delete team" disabled={deleteMutation.isPending}>
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

export function AssignPlayerButton({
  teamId,
  unassignedPlayers,
}: {
  teamId: string;
  unassignedPlayers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [playerId, setPlayerId] = useState("");

  const addMutation = trpc.team.addPlayer.useMutation({
    onSuccess: () => { router.refresh(); setOpen(false); setPlayerId(""); },
  });

  if (unassignedPlayers.length === 0) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-brand font-medium hover:underline mt-2"
      >
        + Add Player
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 mt-2">
      <select
        className="h-8 px-2 text-xs rounded-lg border border-border bg-white flex-1"
        value={playerId}
        onChange={(e) => setPlayerId(e.target.value)}
      >
        <option value="">Select player...</option>
        {unassignedPlayers.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <Button size="sm" className="h-8 text-xs" disabled={!playerId || addMutation.isPending}
        onClick={() => { if (playerId) addMutation.mutate({ teamId, playerId }); }}>
        Add
      </Button>
      <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  );
}
