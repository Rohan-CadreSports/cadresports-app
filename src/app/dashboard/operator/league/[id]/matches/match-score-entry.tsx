"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";

interface TeamInfo {
  id: string;
  name: string;
  players: { id: string; name: string }[];
}

interface Props {
  matchId: string;
  sportSlug: string;
  matchLabel: string;
  teams?: TeamInfo[];
}

export function MatchScoreEntry({ matchId, sportSlug, matchLabel, teams }: Props) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-brand text-xs font-medium hover:underline inline-action">
        Enter Score
      </button>
    );
  }

  if (sportSlug === "badminton") {
    return <BadmintonScoreForm matchId={matchId} label={matchLabel} onClose={() => setOpen(false)} />;
  }

  if (sportSlug === "football") {
    return <FootballScoreForm matchId={matchId} label={matchLabel} teams={teams || []} onClose={() => setOpen(false)} />;
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
    <div className="bg-white border border-border rounded-[8px] p-3 mt-1 space-y-2">
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
          <button type="button" onClick={() => setSets([...sets, { home: "", away: "" }])} className="text-brand font-medium inline-action">+ Set 3</button>
        )}
        {sets.length === 3 && (
          <button type="button" onClick={() => setSets(sets.slice(0, 2))} className="text-red-500 font-medium inline-action">- Set 3</button>
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

interface CardEntry {
  playerName: string;
  playerId: string;
  teamId: string;
  type: "yellow" | "red";
  minute?: number;
}

function FootballScoreForm({ matchId, label, teams, onClose }: { matchId: string; label: string; teams: TeamInfo[]; onClose: () => void }) {
  const router = useRouter();
  const [homeGoals, setHomeGoals] = useState("");
  const [awayGoals, setAwayGoals] = useState("");
  const [extraTime, setExtraTime] = useState(false);
  const [homeET, setHomeET] = useState("");
  const [awayET, setAwayET] = useState("");
  const [cards, setCards] = useState<CardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Card form
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardTeamId, setCardTeamId] = useState("");
  const [cardPlayerId, setCardPlayerId] = useState("");
  const [cardType, setCardType] = useState<"yellow" | "red">("yellow");
  const [cardMinute, setCardMinute] = useState("");

  const selectedTeamForCard = teams.find((t) => t.id === cardTeamId);
  const homeTeam = teams[0];
  const awayTeam = teams[1];

  const submitScore = trpc.match.submitScore.useMutation({
    onSuccess: () => { router.refresh(); setLoading(false); },
    onError: (err) => { setError(err.message); setLoading(false); },
  });

  function addCard() {
    if (!cardPlayerId || !cardTeamId) return;
    const player = selectedTeamForCard?.players.find((p) => p.id === cardPlayerId);
    if (!player) return;
    setCards([...cards, {
      playerName: player.name,
      playerId: player.id,
      teamId: cardTeamId,
      type: cardType,
      minute: cardMinute ? parseInt(cardMinute) : undefined,
    }]);
    setCardPlayerId("");
    setCardMinute("");
    setShowCardForm(false);
  }

  function removeCard(idx: number) {
    setCards(cards.filter((_, i) => i !== idx));
  }

  return (
    <div className="bg-white border border-border rounded-[10px] p-4 mt-2 space-y-3">
      <p className="text-sm font-semibold">{label}</p>

      {/* Full Time */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium">{homeTeam?.name || "Home"}</span>
          <span className="text-xs text-muted-foreground">Full Time</span>
          <span className="text-xs font-medium">{awayTeam?.name || "Away"}</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
          <Input type="number" min={0} placeholder="0" value={homeGoals}
            onChange={(e) => setHomeGoals(e.target.value)} className="text-center h-11 font-bold text-lg" required />
          <span className="text-muted-foreground font-bold text-lg">-</span>
          <Input type="number" min={0} placeholder="0" value={awayGoals}
            onChange={(e) => setAwayGoals(e.target.value)} className="text-center h-11 font-bold text-lg" required />
        </div>
      </div>

      {/* Extra Time */}
      <button type="button" onClick={() => setExtraTime(!extraTime)}
        className={`inline-action w-full text-left py-2.5 px-3 rounded-[8px] text-sm font-medium transition-all ${
          extraTime ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-muted/50 text-muted-foreground hover:bg-muted"
        }`}>
        {extraTime ? "Extra Time ✓" : "+ Extra Time"}
      </button>

      {extraTime && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium">{homeTeam?.name || "Home"}</span>
            <span className="text-xs text-muted-foreground">Extra Time</span>
            <span className="text-xs font-medium">{awayTeam?.name || "Away"}</span>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
            <Input type="number" min={0} placeholder="0" value={homeET}
              onChange={(e) => setHomeET(e.target.value)} className="text-center h-9" />
            <span className="text-muted-foreground text-xs">ET</span>
            <Input type="number" min={0} placeholder="0" value={awayET}
              onChange={(e) => setAwayET(e.target.value)} className="text-center h-9" />
          </div>
        </div>
      )}

      {/* Cards List */}
      {cards.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Cards</p>
          {cards.map((c, i) => {
            const team = teams.find((t) => t.id === c.teamId);
            return (
              <div key={i} className="flex items-center justify-between py-1.5 px-2.5 bg-muted/50 rounded-lg">
                <span className="text-xs">
                  {c.type === "red" ? "🔴" : "🟡"}{" "}
                  {c.playerName}
                  <span className="text-muted-foreground"> ({team?.name})</span>
                  {c.minute ? <span className="text-muted-foreground"> {c.minute}&apos;</span> : ""}
                </span>
                <button onClick={() => removeCard(i)} className="text-red-400 text-xs hover:text-red-600 inline-action">✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Card Form */}
      {showCardForm ? (
        <div className="space-y-2 p-3 bg-muted/30 rounded-[8px] border border-border-light">
          <p className="text-xs font-medium">Add Card</p>
          <select className="w-full h-9 px-3 rounded-[8px] border border-border bg-white text-sm"
            value={cardTeamId} onChange={(e) => { setCardTeamId(e.target.value); setCardPlayerId(""); }}>
            <option value="">Select team...</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          {cardTeamId && (
            <select className="w-full h-9 px-3 rounded-[8px] border border-border bg-white text-sm"
              value={cardPlayerId} onChange={(e) => setCardPlayerId(e.target.value)}>
              <option value="">Select player...</option>
              {selectedTeamForCard?.players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <div className="grid grid-cols-2 gap-2">
            <select className="h-9 px-3 rounded-[8px] border border-border bg-white text-sm"
              value={cardType} onChange={(e) => setCardType(e.target.value as "yellow" | "red")}>
              <option value="yellow">🟡 Yellow</option>
              <option value="red">🔴 Red</option>
            </select>
            <Input type="number" placeholder="Minute" value={cardMinute}
              onChange={(e) => setCardMinute(e.target.value)} className="h-9 text-sm text-center" />
          </div>
          <div className="flex gap-1.5">
            <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => setShowCardForm(false)}>Cancel</Button>
            <Button size="sm" className="flex-1 text-xs" onClick={addCard} disabled={!cardPlayerId}>Add</Button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setShowCardForm(true)}
          className="inline-action w-full text-left py-2.5 px-3 rounded-[8px] text-sm font-medium bg-muted/50 text-muted-foreground hover:bg-muted">
          + Add Card
        </button>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button size="sm" className="flex-1" loading={loading} onClick={() => {
          setLoading(true); setError("");
          const homeCardsList = cards.filter((c) => c.teamId === homeTeam?.id).map((c) => ({ playerName: c.playerName, type: c.type, minute: c.minute }));
          const awayCardsList = cards.filter((c) => c.teamId === awayTeam?.id).map((c) => ({ playerName: c.playerName, type: c.type, minute: c.minute }));
          submitScore.mutate({ matchId, scoreData: {
            home: parseInt(homeGoals) || 0,
            away: parseInt(awayGoals) || 0,
            extraTime,
            homeET: extraTime ? (parseInt(homeET) || 0) : undefined,
            awayET: extraTime ? (parseInt(awayET) || 0) : undefined,
            homeCards: homeCardsList.length > 0 ? homeCardsList : undefined,
            awayCards: awayCardsList.length > 0 ? awayCardsList : undefined,
          } });
        }}>Save Score</Button>
      </div>
    </div>
  );
}
