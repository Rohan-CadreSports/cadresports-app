"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { PlayerCard } from "@/components/player-card";

export default function ProfilePage() {
  const { data: session } = useSession();
  const { data: profile } = trpc.auth.getProfile.useQuery(undefined, {
    enabled: !!session,
  });

  const { data: publicProfile } = trpc.player.getPublicProfile.useQuery(
    { id: session?.user?.id ?? "" },
    { enabled: !!session?.user?.id }
  );

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setBio(profile.bio || "");
      setCity(profile.city || "");
      setState(profile.state || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const updateMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      setSaved(true);
      setError("");
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (err) => {
      setError(err.message || "Failed to save profile");
      setSaved(false);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate({ name, bio, city, state, phone });
  }

  if (!session) {
    return (
      <div className="px-4 py-20 text-center">
        <p className="text-muted-foreground">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Player Card — the hero of the page */}
      {publicProfile && (
        <div className="px-3 pt-4">
          <PlayerCard
            player={{
              id: publicProfile.id,
              name: publicProfile.name,
              city: publicProfile.city,
              gender: publicProfile.gender,
              role: publicProfile.role,
              createdAt: publicProfile.createdAt as unknown as string,
              favoriteSports: publicProfile.favoriteSports,
              image: publicProfile.image,
            }}
            stats={publicProfile.stats}
          />
        </div>
      )}

      <div className="px-4 mt-5 space-y-4">
        {/* Account details */}
        <Card>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-right truncate ml-4">{profile?.email || session.user.email}</span>
            </div>
            {profile?.gender && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gender</span>
                <span className="font-medium">{profile.gender}</span>
              </div>
            )}
            {profile?.dateOfBirth && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date of Birth</span>
                <span className="font-medium">
                  {new Date(profile.dateOfBirth).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            )}
          </div>
        </Card>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3">{error}</div>
        )}

        {/* Edit form */}
        <Card>
          <p className="text-[10px] tracking-wide font-sans font-medium uppercase text-muted-foreground mb-3">Edit Profile</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input id="name" label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input id="phone" label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Input id="city" label="City" value={city} onChange={(e) => setCity(e.target.value)} />
              <Input id="state" label="State" value={state} onChange={(e) => setState(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Bio</label>
              <textarea
                className="w-full px-3.5 py-2.5 rounded-[8px] border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand focus:bg-surface transition-all min-h-[72px] text-[14px]"
                placeholder="Tell us about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" loading={updateMutation.isPending}>
              {saved ? "Saved!" : "Save Profile"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
