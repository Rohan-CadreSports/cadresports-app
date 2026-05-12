"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { Trophy, ArrowRight } from "lucide-react";

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Basic info
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");

  // Step 2: Sports & City
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Step 3: Password (for Google users who don't have one yet)
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);

  const { data: sports } = trpc.sport.list.useQuery();

  const completeMutation = trpc.auth.completeOnboarding.useMutation({
    onSuccess: () => {
      router.push("/dashboard");
    },
    onError: (err) => {
      setError(err.message);
      setLoading(false);
    },
  });

  const { data: profile } = trpc.auth.checkNeedsPassword.useQuery(undefined, {
    enabled: !!session,
  });

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
    if (profile?.needsPassword) {
      setNeedsPassword(true);
    }
  }, [session, profile]);

  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/signin");
    return null;
  }

  function toggleSport(sportId: string) {
    setSelectedSports((prev) =>
      prev.includes(sportId)
        ? prev.filter((s) => s !== sportId)
        : [...prev, sportId]
    );
  }

  function handleSubmit() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!dob) {
      setError("Date of birth is required");
      return;
    }
    if (!gender) {
      setError("Please select your gender");
      return;
    }
    if (!city.trim()) {
      setError("City is required");
      return;
    }
    if (needsPassword) {
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }

    setLoading(true);
    setError("");
    completeMutation.mutate({
      name: name.trim(),
      dateOfBirth: dob,
      gender: gender as "MALE" | "FEMALE" | "OTHER",
      favoriteSports: selectedSports,
      city: city.trim(),
      state: state.trim(),
      password: needsPassword ? password : undefined,
    });
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-sm space-y-5">
        {/* Header */}
        <div className="text-center">
          <img src="/logo.png" alt="CadreSports" className="w-14 h-14 rounded-[10px] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-dark">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-1">Tell us about yourself to get started</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2">
          <div className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-brand" : "bg-border"}`} />
          <div className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-brand" : "bg-border"}`} />
          {needsPassword && <div className={`h-1 flex-1 rounded-full ${step >= 3 ? "bg-brand" : "bg-border"}`} />}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-[8px]">{error}</div>
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <Card className="space-y-4">
            <h2 className="font-semibold">About You</h2>
            <Input
              id="name"
              label="Full Name *"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              id="dob"
              label="Date of Birth *"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              required
            />
            <Select
              id="gender"
              label="Gender *"
              placeholder="Select gender"
              options={[
                { value: "MALE", label: "Male" },
                { value: "FEMALE", label: "Female" },
                { value: "OTHER", label: "Other" },
              ]}
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
            />
            <Button
              className="w-full"
              onClick={() => {
                if (!name.trim() || !dob || !gender) {
                  setError("Please fill in all required fields");
                  return;
                }
                setError("");
                setStep(2);
              }}
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>
        )}

        {/* Step 2: Sports & Location */}
        {step === 2 && (
          <Card className="space-y-4">
            <h2 className="font-semibold">Your Sports</h2>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Favorite Sports (select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {sports?.map((sport) => (
                  <button
                    key={sport.id}
                    type="button"
                    onClick={() => toggleSport(sport.id)}
                    className={`flex items-center gap-2 p-3 rounded-[8px] border transition-all text-left ${
                      selectedSports.includes(sport.id)
                        ? "border-brand bg-brand/5 text-brand"
                        : "border-border hover:border-brand/50"
                    }`}
                  >
                    <span className="text-sm font-medium">{sport.name}</span>
                  </button>
                )) ?? (
                  <p className="text-sm text-muted-foreground col-span-2">Loading sports...</p>
                )}
              </div>
            </div>

            <h2 className="font-semibold pt-2">Where do you play?</h2>
            <Input
              id="city"
              label="City *"
              placeholder="e.g. Mumbai"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
            <Input
              id="state"
              label="State"
              placeholder="e.g. Maharashtra"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />

            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="flex-1" loading={needsPassword ? false : loading} onClick={() => {
                if (!city.trim()) { setError("City is required"); return; }
                if (needsPassword) { setError(""); setStep(3); }
                else handleSubmit();
              }}>
                {needsPassword ? "Continue" : "Get Started"}
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Set Password (Google users only) */}
        {step === 3 && needsPassword && (
          <Card className="space-y-4">
            <h2 className="font-semibold">Set Your Password</h2>
            <p className="text-sm text-muted-foreground">Create a password so you can also sign in with email.</p>
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <Input
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-sm text-red-500">Passwords do not match</p>
            )}
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button className="flex-1" loading={loading} onClick={handleSubmit}>
                Get Started
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
