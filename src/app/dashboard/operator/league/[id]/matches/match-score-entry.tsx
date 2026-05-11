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

interface CardEntry {
  playerName: string;
  type: "yellow" | "red";
  minute?: number;
}

function FootballScoreForm({ matchId, label, onClose }: { matchId: string; label: string; onClose: () => void }) {
  const router = useRouter();
  const [homeGoals, setHomeGoals] = useState("");
  const [awayGoals, setAwayGoals] = useState("");
  const [extraTime, setExtraTime] = useState(false);
  const [homeET, setHomeET] = useState("");
  const [awayET, setAwayET] = useState("");
  const [homeCards, setHomeCards] = useState<CardEntry[]>([]);
  const [awayCards, setAwayCards] = useState<CardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Card input state
  const [cardSide, setCardSide] = useState<"home" | "away">("home");
  const [cardPlayer, setCardPlayer] = useState("");
  const [cardType, setCardType] = useState<"yellow" | "red">("yellow");
  const [cardMinute, setCardMinute] = useState("");
  const [showCardForm, setShowCardForm] = useState(false);

  const submitScore = trpc.match.submitScore.useMutation({
    onSuccess: () => { router.refresh(); setLoading(false); },
    onError: (err) => { setError(err.message); setLoading(false); },
  });

  function addCard() {
    if (!cardPlayer.trim()) return;
    const card: CardEntry = { playerName: cardPlayer.trim(), type: cardType, minute: cardMinute ? parseInt(cardMinute) : undefined };
    if (cardSide === "home") setHomeCards([...homeCards, card]);
    else setAwayCards([...awayCards, card]);
    setCardPlayer("");
    setCardMinute("");
    setShowCardForm(false);
  }

  return (
    <div className="bg-white border border-border rounded-xl p-3 mt-1 space-y-3">
      <p className="text-sm font-medium">{label}</p>

      {/* Goals */}
      <div>
        <p className="text-xs text-muted-foreground mb-1">Full Time Score</p>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
          <Input type="number" min={0} placeholder="0" value={homeGoals}
            onChange={(e) => setHomeGoals(e.target.value)} className="text-center h-10 font-bold text-lg" required />
          <span className="text-muted-foreground font-bold">-</span>
          <Input type="number" min={0} placeholder="0" value={awayGoals}
            onChange={(e) => setAwayGoals(e.target.value)} className="text-center h-10 font-bold text-lg" required />
        </div>
      </div>

      {/* Extra Time Toggle */}
      <button
        type="button"
        onClick={() => setExtraTime(!extraTime)}
        className={`inline-action w-full text-left py-2 px-3 rounded-xl text-xs font-medium transition-all ${
          extraTime ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-muted/50 text-muted-foreground hover:bg-muted"
        }`}
      >
        {extraTime ? "Extra Time ✓" : "+ Extra Time"}
      </button>

      {extraTime && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Extra Time Goals</p>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
            <Input type="number" min={0} placeholder="0" value={homeET}
              onChange={(e) => setHomeET(e.target.value)} className="text-center h-9" />
            <span className="text-muted-foreground text-xs">ET</span>
            <Input type="number" min={0} placeholder="0" value={awayET}
              onChange={(e) => setAwayET(e.target.value)} className="text-center h-9" />
          </div>
        </div>
      )}

      {/* Cards */}
      {(homeCards.length > 0 || awayCards.length > 0) && (
        <div className="space-y-1">
          {[...homeCards.map((c, i) => ({ ...c, side: "Home", idx: i })), ...awayCards.map((c, i) => ({ ...c, side: "Away", idx: i }))].map((c, i) => (
            <div key={i} className="flex items-center justify-between py-1 px-2 bg-muted/50 rounded-lg text-xs">
              <span>
                <span className={c.type === "red" ? "text-red-500 font-bold" : "text-yellow-500 font-bold"}>
                  {c.type === "red" ? "🔴" : "🟡"}
                </span>
                {" "}{c.playerName} ({c.side}){c.minute ? ` ${c.minute}'` : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      {showCardForm ? (
        <div className="space-y-2 p-2 bg-muted/30 rounded-xl">
          <div className="grid grid-cols-2 gap-2">
            <select className="h-8 px-2 text-xs rounded-lg border border-border bg-white" value={cardSide} onChange={(e) => setCardSide(e.target.value as "home" | "away")}>
              <option value="home">Home</option>
              <option value="away">Away</option>
            </select>
            <select className="h-8 px-2 text-xs rounded-lg border border-border bg-white" value={cardType} onChange={(e) => setCardType(e.target.value as "yellow" | "red")}>
              <option value="yellow">Yellow Card</option>
              <option value="red">Red Card</option>
            </select>
          </div>
          <div className="grid grid-cols-[1fr_60px] gap-2">
            <Input placeholder="Player name" value={cardPlayer} onChange={(e) => setCardPlayer(e.target.value)} className="h-8 text-xs" />
            <Input type="number" placeholder="Min" value={cardMinute} onChange={(e) => setCardMinute(e.target.value)} className="h-8 text-xs text-center" />
          </div>
          <div className="flex gap-1.5">
            <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs" onClick={() => setShowCardForm(false)}>Cancel</Button>
            <Button size="sm" className="flex-1 h-7 text-xs" onClick={addCard}>Add Card</Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCardForm(true)}
          className="inline-action w-full text-left py-2 px-3 rounded-xl text-xs font-medium bg-muted/50 text-muted-foreground hover:bg-muted"
        >
          + Add Card (Yellow/Red)
        </button>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-1.5">
        <Button type="button" variant="ghost" size="sm" className="flex-1 h-8 text-xs" onClick={onClose}>Cancel</Button>
        <Button size="sm" className="flex-1 h-8 text-xs" loading={loading} onClick={() => {
          setLoading(true); setError("");
          submitScore.mutate({ matchId, scoreData: {
            home: parseInt(homeGoals) || 0,
            away: parseInt(awayGoals) || 0,
            extraTime,
            homeET: extraTime ? (parseInt(homeET) || 0) : undefined,
            awayET: extraTime ? (parseInt(awayET) || 0) : undefined,
            homeCards: homeCards.length > 0 ? homeCards : undefined,
            awayCards: awayCards.length > 0 ? awayCards : undefined,
          } });
        }}>Save</Button>
      </div>
    </div>
  );
}
