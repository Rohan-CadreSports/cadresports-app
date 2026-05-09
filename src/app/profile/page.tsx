"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc/client";
import { User } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const { data: profile } = trpc.auth.getProfile.useQuery(undefined, {
    enabled: !!session,
  });

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
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-6 space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 bg-brand rounded-full flex items-center justify-center mx-auto mb-3">
          {profile?.image ? (
            <img src={profile.image} alt="" className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <User className="w-10 h-10 text-white" />
          )}
        </div>
        <h1 className="text-xl font-bold">{profile?.name || session.user.name}</h1>
        <Badge variant="info" className="mt-1">
          {(profile?.role || session.user.role).replace(/_/g, " ")}
        </Badge>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{error}</div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="name" label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input id="phone" label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input id="city" label="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <Input id="state" label="State" value={state} onChange={(e) => setState(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Bio</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all min-h-[80px] text-base"
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

      <Card>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{profile?.email || session.user.email}</span>
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
          <div className="flex justify-between">
            <span className="text-muted-foreground">Member since</span>
            <span className="font-medium">
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
                : "—"}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
