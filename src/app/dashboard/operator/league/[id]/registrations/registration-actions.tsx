"use client";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

export function RegistrationActions({ registrationId }: { registrationId: string }) {
  const router = useRouter();

  const updateMutation = trpc.registration.updateStatus.useMutation({
    onSuccess: () => router.refresh(),
  });

  const isPending = updateMutation.isPending;

  return (
    <div className="flex items-center gap-1.5">
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
        onClick={() => updateMutation.mutate({ registrationId, status: "APPROVED" })}
        disabled={isPending}
        title="Approve"
      >
        <Check className="w-4 h-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
        onClick={() => updateMutation.mutate({ registrationId, status: "REJECTED" })}
        disabled={isPending}
        title="Reject"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
