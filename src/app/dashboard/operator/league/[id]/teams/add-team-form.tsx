"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

interface Props {
  divisionId: string;
  // We need at least one approved player to be the initial captain
  availablePlayers: { id: string; name: string }[];
}

export function AddTeamForm({ divisionId, availablePlayers }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [captainId, setCaptainId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createTeam = trpc.team.create.useMutation({
    onSuccess: () => {
      router.refresh();
      setOpen(false);
      setTeamName("");
      setCaptainId("");
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
        className="w-full py-4 border-2 border-dashed border-border rounded-2xl text-sm text-muted-foreground hover:border-brand hover:text-brand transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" /> Create Team
      </button>
    );
  }

  return (
    <Card className="border-brand">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!captainId) {
            setError("Select an initial captain");
            return;
          }
          setLoading(true);
          setError("");
          createTeam.mutate({ name: teamName, divisionId, captainId });
        }}
        className="space-y-3"
      >
        <h3 className="font-semibold text-sm">New Team</h3>
        <Input
          placeholder="Team name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          required
        />
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Initial Captain *</label>
          <select
            className="w-full h-11 px-4 rounded-xl border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base"
            value={captainId}
            onChange={(e) => setCaptainId(e.target.value)}
            required
          >
            <option value="">Select a player</option>
            {availablePlayers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">Captain can be changed later from team members</p>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" className="flex-1" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" size="sm" className="flex-1" loading={loading}>
            Create Team
          </Button>
        </div>
      </form>
    </Card>
  );
}
