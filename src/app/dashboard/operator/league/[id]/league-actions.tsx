"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImageIcon, Check } from "lucide-react";

const STATUS_FLOW: Record<string, { next: string; label: string; variant: "primary" | "secondary" | "danger" }[]> = {
  DRAFT: [
    { next: "REGISTRATION_OPEN", label: "Open Registration", variant: "primary" },
    { next: "CANCELLED", label: "Cancel", variant: "danger" },
  ],
  REGISTRATION_OPEN: [
    { next: "REGISTRATION_CLOSED", label: "Close Registration", variant: "secondary" },
    { next: "CANCELLED", label: "Cancel", variant: "danger" },
  ],
  REGISTRATION_CLOSED: [
    { next: "IN_PROGRESS", label: "Start League", variant: "primary" },
    { next: "REGISTRATION_OPEN", label: "Reopen Registration", variant: "secondary" },
  ],
  IN_PROGRESS: [{ next: "COMPLETED", label: "Mark Completed", variant: "secondary" }],
  COMPLETED: [],
  CANCELLED: [],
};

export function LeagueActions({
  leagueId,
  currentStatus,
  currentImageUrl,
}: {
  leagueId: string;
  currentStatus: string;
  currentImageUrl?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showImageEdit, setShowImageEdit] = useState(false);
  const [imageUrl, setImageUrl] = useState(currentImageUrl || "");
  const [imageSaved, setImageSaved] = useState(false);

  const updateStatus = trpc.league.updateStatus.useMutation({
    onSuccess: () => {
      router.refresh();
      setLoading(false);
      setError("");
    },
    onError: (err) => {
      setError(err.message);
      setLoading(false);
    },
  });

  const updateImage = trpc.league.updateImage.useMutation({
    onSuccess: () => {
      router.refresh();
      setImageSaved(true);
      setTimeout(() => setImageSaved(false), 2000);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const actions = STATUS_FLOW[currentStatus] || [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.next}
            variant={action.variant}
            size="sm"
            loading={loading}
            onClick={() => {
              if (action.variant === "danger" && !confirm("Are you sure? This action cannot be undone.")) {
                return;
              }
              setLoading(true);
              setError("");
              updateStatus.mutate({
                leagueId,
                status: action.next as "DRAFT" | "REGISTRATION_OPEN" | "REGISTRATION_CLOSED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
              });
            }}
          >
            {action.label}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowImageEdit(!showImageEdit)}
        >
          <ImageIcon className="w-4 h-4 mr-1" />
          {showImageEdit ? "Close" : "Change Image"}
        </Button>
      </div>

      {showImageEdit && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              id="leagueImage"
              label="League Card Image URL"
              placeholder="https://example.com/photo.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            loading={updateImage.isPending}
            onClick={() => updateImage.mutate({ leagueId, imageUrl })}
          >
            {imageSaved ? <Check className="w-4 h-4" /> : "Save"}
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
