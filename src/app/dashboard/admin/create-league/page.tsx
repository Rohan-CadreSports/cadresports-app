"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";

export default function AdminCreateLeaguePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 1. League Name
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // 2. Dates
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [registrationEnd, setRegistrationEnd] = useState("");

  // 3. Location
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [venue, setVenue] = useState("");

  // 4. Federation (optional)
  const [federationId, setFederationId] = useState("");

  // 5. Sport
  const [sportId, setSportId] = useState("");

  // 6. Operator
  const [operatorId, setOperatorId] = useState("");

  // 7. Mode
  const [mode, setMode] = useState<"TEAM" | "INDIVIDUAL">("TEAM");

  // 8. Gender
  const [genderRestriction, setGenderRestriction] = useState<"OPEN" | "MENS_ONLY" | "WOMENS_ONLY">("OPEN");

  // 9. Divisions
  const [divisions, setDivisions] = useState(["Division A"]);
  const [maxTeamsPerDiv, setMaxTeamsPerDiv] = useState("8");

  // 10. Format / Structure
  const [structure, setStructure] = useState<"ROUND_ROBIN" | "ROUND_ROBIN_DOUBLE" | "TOURNAMENT" | "HYBRID">("ROUND_ROBIN");
  const [hybridTopN, setHybridTopN] = useState("4");

  // 11. Match Config
  const [singlesCount, setSinglesCount] = useState("0");
  const [doublesCount, setDoublesCount] = useState("0");

  // 12. Team Size
  const [minTeamSize, setMinTeamSize] = useState("2");
  const [maxTeamSize, setMaxTeamSize] = useState("10");

  const { data: sports } = trpc.sport.list.useQuery();
  const { data: operators } = trpc.admin.listOperators.useQuery();
  const { data: federations } = trpc.admin.listFederations.useQuery(
    sportId ? { sportId } : undefined
  );

  const createMutation = trpc.league.create.useMutation({
    onSuccess: () => {
      router.push("/dashboard/admin");
    },
    onError: (err) => {
      setError(err.message);
      setLoading(false);
    },
  });

  function addDivision() {
    setDivisions([...divisions, `Division ${String.fromCharCode(65 + divisions.length)}`]);
  }

  function removeDivision(idx: number) {
    if (divisions.length <= 1) return;
    setDivisions(divisions.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!operatorId) {
      setError("You must assign a Tournament Operator");
      return;
    }
    if (!city.trim()) {
      setError("City is required");
      return;
    }

    // Date validation
    const today = new Date().toISOString().split("T")[0];
    if (registrationEnd && registrationEnd < today) {
      setError("Registration deadline must be today or later");
      return;
    }
    if (startDate && registrationEnd && startDate <= registrationEnd) {
      setError("Start date must be after registration deadline");
      return;
    }
    if (endDate && startDate && endDate <= startDate) {
      setError("End date must be after start date");
      return;
    }

    const sc = parseInt(singlesCount) || 0;
    const dc = parseInt(doublesCount) || 0;
    const totalMatches = sc + dc;

    if (mode === "TEAM" && totalMatches > 0 && totalMatches % 2 === 0) {
      setError("Total matches per tie must be an odd number for team mode");
      return;
    }

    setLoading(true);
    setError("");

    createMutation.mutate({
      name,
      sportId,
      operatorId,
      structure,
      mode,
      genderRestriction,
      description: description || undefined,
      city: city.trim(),
      state: state || undefined,
      venue: venue || undefined,
      maxTeamsPerDiv: parseInt(maxTeamsPerDiv) || 8,
      minTeamSize: parseInt(minTeamSize) || 2,
      maxTeamSize: parseInt(maxTeamSize) || 10,
      matchConfig: {
        singlesCount: sc,
        doublesCount: dc,
        matchesPerTie: sc + dc > 0 ? sc + dc : 1,
      },
      hybridTopN: structure === "HYBRID" ? parseInt(hybridTopN) || 4 : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      registrationEnd: registrationEnd || undefined,
      divisions,
      federationId: federationId || undefined,
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin" className="p-2 hover:bg-muted rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Create New League</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. League Name & Description */}
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>League Name</CardTitle>
            <CardDescription>Give your league a memorable name.</CardDescription>
          </CardHeader>
          <Input
            id="name"
            label="League Name"
            placeholder="e.g. Mumbai Badminton League 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Description
            </label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all min-h-[80px] text-base"
              placeholder="Describe your league..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </Card>

        {/* 2. Dates */}
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Dates</CardTitle>
            <CardDescription>Set league schedule and registration deadline.</CardDescription>
          </CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              id="startDate"
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              id="endDate"
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Input
              id="registrationEnd"
              label="Registration Deadline"
              type="date"
              value={registrationEnd}
              onChange={(e) => setRegistrationEnd(e.target.value)}
            />
          </div>
        </Card>

        {/* 3. Location */}
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>City is required.</CardDescription>
          </CardHeader>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="city"
              label="City *"
              placeholder="Mumbai"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
            <Input
              id="state"
              label="State"
              placeholder="Maharashtra"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>
          <Input
            id="venue"
            label="Venue"
            placeholder="e.g. Sports Complex"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
          />
        </Card>

        {/* 4. Sport & Operator */}
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Sport & Operator</CardTitle>
            <CardDescription>Select the sport and assign an operator.</CardDescription>
          </CardHeader>
          <Select
            id="sport"
            label="Sport *"
            placeholder="Select a sport"
            options={sports?.map((s) => ({ value: s.id, label: s.name })) ?? []}
            value={sportId}
            onChange={(e) => setSportId(e.target.value)}
            required
          />
          <Select
            id="operator"
            label="Tournament Operator *"
            placeholder="Select an operator"
            options={
              operators?.map((o) => ({
                value: o.id,
                label: `${o.name} (${o.email})`,
              })) ?? []
            }
            value={operatorId}
            onChange={(e) => setOperatorId(e.target.value)}
            required
          />
        </Card>

        {/* 5. Federation (optional) */}
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Federation</CardTitle>
            <CardDescription>Optionally link this league to a federation.</CardDescription>
          </CardHeader>
          <Select
            id="federation"
            label="Federation"
            placeholder="None (independent league)"
            options={
              federations?.map((f) => ({
                value: f.id,
                label: `${f.name} (${f.sport?.name ?? ""})`,
              })) ?? []
            }
            value={federationId}
            onChange={(e) => setFederationId(e.target.value)}
          />
        </Card>

        {/* 6. Mode & Gender */}
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Mode & Gender</CardTitle>
            <CardDescription>Choose team or individual play, and gender restriction.</CardDescription>
          </CardHeader>
          <div className="grid grid-cols-2 gap-3">
            <Select
              id="mode"
              label="League Mode *"
              options={[
                { value: "TEAM", label: "Team-based" },
                { value: "INDIVIDUAL", label: "Individual" },
              ]}
              value={mode}
              onChange={(e) => setMode(e.target.value as "TEAM" | "INDIVIDUAL")}
            />
            <Select
              id="genderRestriction"
              label="Gender Restriction *"
              options={[
                { value: "OPEN", label: "Open (All)" },
                { value: "MENS_ONLY", label: "Men's Only" },
                { value: "WOMENS_ONLY", label: "Women's Only" },
              ]}
              value={genderRestriction}
              onChange={(e) =>
                setGenderRestriction(e.target.value as "OPEN" | "MENS_ONLY" | "WOMENS_ONLY")
              }
            />
          </div>
        </Card>

        {/* 7. Divisions */}
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Divisions</CardTitle>
            <CardDescription>Add one or more divisions. Each will have its own standings.</CardDescription>
          </CardHeader>
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={addDivision}
              className="text-brand text-sm font-medium flex items-center gap-1 hover:underline"
            >
              <Plus className="w-4 h-4" /> Add Division
            </button>
          </div>
          {divisions.map((div, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={div}
                onChange={(e) => {
                  const updated = [...divisions];
                  updated[idx] = e.target.value;
                  setDivisions(updated);
                }}
                placeholder={`Division ${idx + 1}`}
              />
              {divisions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDivision(idx)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {mode === "TEAM" && (
            <Input
              id="maxTeamsPerDiv"
              label="Max Teams per Division"
              type="number"
              min={2}
              max={128}
              value={maxTeamsPerDiv}
              onChange={(e) => setMaxTeamsPerDiv(e.target.value)}
            />
          )}
        </Card>

        {/* 8. Format / Structure */}
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Format</CardTitle>
            <CardDescription>
              Choose the competition format. Hybrid combines round-robin with a knockout stage.
            </CardDescription>
          </CardHeader>
          <Select
            id="structure"
            label="Structure *"
            options={[
              { value: "ROUND_ROBIN", label: "Round Robin (RR)" },
              { value: "ROUND_ROBIN_DOUBLE", label: "Round Robin 2.0 (RR2)" },
              { value: "TOURNAMENT", label: "Knockout Tournament" },
              { value: "HYBRID", label: "Hybrid (RR + Knockout)" },
            ]}
            value={structure}
            onChange={(e) =>
              setStructure(
                e.target.value as "ROUND_ROBIN" | "ROUND_ROBIN_DOUBLE" | "TOURNAMENT" | "HYBRID"
              )
            }
          />
          {structure === "HYBRID" && (
            <Input
              id="hybridTopN"
              label="Top N teams advance to knockout"
              type="number"
              min={2}
              max={32}
              value={hybridTopN}
              onChange={(e) => setHybridTopN(e.target.value)}
            />
          )}
        </Card>

        {/* 9. Match Config */}
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Match Config</CardTitle>
            <CardDescription>
              For badminton-type sports, set how many singles and doubles matches make up each tie.
              Total should be odd for team mode.
            </CardDescription>
          </CardHeader>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="singlesCount"
              label="Singles Matches"
              type="number"
              min={0}
              max={10}
              value={singlesCount}
              onChange={(e) => setSinglesCount(e.target.value)}
            />
            <Input
              id="doublesCount"
              label="Doubles Matches"
              type="number"
              min={0}
              max={10}
              value={doublesCount}
              onChange={(e) => setDoublesCount(e.target.value)}
            />
          </div>
          {(parseInt(singlesCount) || 0) + (parseInt(doublesCount) || 0) > 0 && (
            <p className="text-sm text-muted-foreground">
              Total matches per tie:{" "}
              <span className="font-medium text-foreground">
                {(parseInt(singlesCount) || 0) + (parseInt(doublesCount) || 0)}
              </span>
              {mode === "TEAM" &&
                ((parseInt(singlesCount) || 0) + (parseInt(doublesCount) || 0)) % 2 === 0 && (
                  <span className="text-red-500 ml-2">
                    (Should be odd for team mode)
                  </span>
                )}
            </p>
          )}
        </Card>

        {/* 10. Team Size (only for TEAM mode) */}
        {mode === "TEAM" && (
          <Card className="space-y-4">
            <CardHeader>
              <CardTitle>Team Size</CardTitle>
              <CardDescription>
                Set the minimum and maximum number of players per team.
              </CardDescription>
            </CardHeader>
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="minTeamSize"
                label="Minimum Players"
                type="number"
                min={1}
                max={30}
                value={minTeamSize}
                onChange={(e) => setMinTeamSize(e.target.value)}
              />
              <Input
                id="maxTeamSize"
                label="Maximum Players"
                type="number"
                min={1}
                max={30}
                value={maxTeamSize}
                onChange={(e) => setMaxTeamSize(e.target.value)}
              />
            </div>
          </Card>
        )}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Create League
        </Button>
      </form>
    </div>
  );
}
