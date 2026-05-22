"use client";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImageIcon, Check, Upload, Trash2 } from "lucide-react";
import Image from "next/image";

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
  const [imagePreview, setImagePreview] = useState(currentImageUrl || "");
  const [imageSaved, setImageSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }

      setImageUrl(data.url);
      setImagePreview(URL.createObjectURL(file));
      updateImage.mutate({ leagueId, imageUrl: data.url });
    } catch {
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  function removeImage() {
    setImageUrl("");
    setImagePreview("");
    updateImage.mutate({ leagueId, imageUrl: "" });
  }

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
        <div className="space-y-3">
          {imagePreview ? (
            <div className="relative w-full h-40 rounded-[8px] overflow-hidden border border-border">
              <Image
                src={imagePreview}
                alt="League image"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-[8px] cursor-pointer hover:border-brand hover:bg-brand/5 transition-colors">
              <Upload className="w-5 h-5 text-muted-foreground mb-1" />
              <span className="text-sm text-muted-foreground">
                {uploading ? "Uploading..." : "Click to upload image"}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">
                JPEG, PNG, WebP or GIF (max 5MB)
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}
          {imageSaved && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <Check className="w-4 h-4" /> Image saved
            </p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
