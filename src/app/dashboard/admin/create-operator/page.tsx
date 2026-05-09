"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateOperatorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const createMutation = trpc.admin.createOperator.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => router.push("/dashboard/admin"), 1500);
    },
    onError: (err) => {
      setError(err.message);
      setLoading(false);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    createMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone || undefined,
      city: city || undefined,
      state: state || undefined,
    });
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin" className="p-2 hover:bg-muted rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Create Tournament Operator</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 text-sm p-3 rounded-xl">
          Operator created successfully! Redirecting...
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name"
            label="Full Name *"
            placeholder="Operator's full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            id="email"
            label="Email *"
            type="email"
            placeholder="operator@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="password"
            label="Password *"
            type="password"
            placeholder="Min. 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <Input
            id="phone"
            label="Phone"
            type="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="city"
              label="City"
              placeholder="Mumbai"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <Input
              id="state"
              label="State"
              placeholder="Maharashtra"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" loading={loading}>
            Create Operator
          </Button>
        </form>
      </Card>
    </div>
  );
}
