"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateFederationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [sportId, setSportId] = useState("");
  const [level, setLevel] = useState("STATE");
  const [area, setArea] = useState("");

  const { data: sports } = trpc.sport.list.useQuery();

  const createMutation = trpc.admin.createFederation.useMutation({
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

  return (
    <div className="max-w-sm mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin" className="p-2 hover:bg-muted rounded-[8px]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Create Federation</h1>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-[8px]">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 text-sm p-3 rounded-[8px]">Federation created!</div>}

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setLoading(true);
            setError("");
            createMutation.mutate({
              name,
              sportId,
              level: level as "DISTRICT" | "STATE" | "NATIONAL",
              area,
            });
          }}
          className="space-y-4"
        >
          <Input id="name" label="Federation Name *" placeholder="e.g. Maharashtra Badminton Federation" value={name} onChange={(e) => setName(e.target.value)} required />
          <Select
            id="sport"
            label="Sport *"
            placeholder="Select sport"
            options={sports?.map((s) => ({ value: s.id, label: s.name })) ?? []}
            value={sportId}
            onChange={(e) => setSportId(e.target.value)}
            required
          />
          <Select
            id="level"
            label="Level *"
            options={[
              { value: "DISTRICT", label: "District" },
              { value: "STATE", label: "State" },
              { value: "NATIONAL", label: "National" },
            ]}
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          />
          <Input id="area" label="Area *" placeholder="e.g. Maharashtra, Mumbai" value={area} onChange={(e) => setArea(e.target.value)} required />
          <Button type="submit" className="w-full" loading={loading}>Create Federation</Button>
        </form>
      </Card>
    </div>
  );
}
