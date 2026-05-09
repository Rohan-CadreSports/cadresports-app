"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";

interface Props {
  matchId: string;
  sportSlug: string;
  matchLabel: string;
}

export function MatchScoreEntry({ matchId, sportSlug, matchLabel }: Props) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-brand text-xs font-medium hover:underline"
      >
        Enter Score
      </button>
    );
  }

  if (sportSlug === "badminton") {
    return <BadmintonScoreForm matchId={matchId} label={matchLabel} onClose={() => setOpen(false)} />;
  }

  if (sportSlug === "football") {
    return <FootballScoreForm matchId={matchId} label={matchLabel} onClose={() => setOpen(false)} />;
  }

  return <p className="text-xs text-red-500">Scoring not configured</p>;
}

function BadmintonScoreForm({ matchId, label, onClose }: { matchId: string; label: string; onClose: () => void }) {
  const router = useRouter();
  const [sets, setSets] = useState([{ home: "", away: "" }, { home: "", away: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitScore = trpc.match.submitScore.useMutation({
    onSuccess: () => { router.refresh(); setLoading(false); },
    onError: (err) => { setError(err.message); setLoading(false); },
  });

  return (
    <div className="bg-white border border-border rounded-xl p-3 mt-1 space-y-2">
      <p className="text-xs font-medium">{label}</p>
      {sets.map((set, idx) => (
        <div key={idx} className="grid grid-cols-[1fr_auto_1fr] gap-1.5 items-center">
          <Input type="number" min={0} max={30} placeholder="0" value={set.home}
            onChange={(e) => { const u = [...sets]; u[idx] = { ...u[idx], home: e.target.value }; setSets(u); }}
            className="text-center h-8 text-xs" />
          <span className="text-xs text-muted-foreground w-6 text-center">S{idx + 1}</span>
          <Input type="number" min={0} max={30} placeholder="0" value={set.away}
            onChange={(e) => { const u = [...sets]; u[idx] = { ...u[idx], away: e.target.value }; setSets(u); }}
            className="text-center h-8 text-xs" />
        </div>
      ))}
      <div className="flex justify-center gap-2 text-xs">
        {sets.length < 3 && (
          <button type="button" onClick={() => setSets([...sets, { home: "", away: "" }])} className="text-brand font-medium">+ Set 3</button>
        )}
        {sets.length === 3 && (
          <button type="button" onClick={() => setSets(sets.slice(0, 2))} className="text-red-500 font-medium">- Set 3</button>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-1.5">
        <Button type="button" variant="ghost" size="sm" className="flex-1 h-7 text-xs" onClick={onClose}>Cancel</Button>
        <Button size="sm" className="flex-1 h-7 text-xs" loading={loading} onClick={() => {
          setLoading(true); setError("");
          submitScore.mutate({
            matchId,
            scoreData: {
              sets: sets.filter((s) => s.home !== "" && s.away !== "").map((s) => ({
                home: parseInt(s.home), away: parseInt(s.away),
              })),
            },
          });
        }}>Save</Button>
      </div>
    </div>
  );
}

function FootballScoreForm({ matchId, label, onClose }: { matchId: string; label: string; onClose: () => void }) {
  const router = useRouter();
  const [homeGoals, setHomeGoals] = useState("");
  const [awayGoals, setAwayGoals] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitScore = trpc.match.submitScore.useMutation({
    onSuccess: () => { router.refresh(); setLoading(false); },
    onError: (err) => { setError(err.message); setLoading(false); },
  });

  return (
    <div className="bg-white border border-border rounded-xl p-3 mt-1 space-y-2">
      <p className="text-xs font-medium">{label}</p>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
        <Input type="number" min={0} placeholder="0" value={homeGoals}
          onChange={(e) => setHomeGoals(e.target.value)} className="text-center h-9 font-bold" required />
        <span className="text-muted-foreground font-bold">-</span>
        <Input type="number" min={0} placeholder="0" value={awayGoals}
          onChange={(e) => setAwayGoals(e.target.value)} className="text-center h-9 font-bold" required />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-1.5">
        <Button type="button" variant="ghost" size="sm" className="flex-1 h-7 text-xs" onClick={onClose}>Cancel</Button>
        <Button size="sm" className="flex-1 h-7 text-xs" loading={loading} onClick={() => {
          setLoading(true); setError("");
          submitScore.mutate({ matchId, scoreData: { home: parseInt(homeGoals), away: parseInt(awayGoals) } });
        }}>Save</Button>
      </div>
    </div>
  );
}
