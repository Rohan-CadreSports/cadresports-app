export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RegistrationActions } from "./registration-actions";

export default async function RegistrationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("TOURNAMENT_OPERATOR");
  const { id } = await params;

  const league = await db.league.findUnique({
    where: { id },
    include: {
      registrations: {
        include: {
          player: {
            select: { id: true, name: true, email: true, phone: true, city: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!league) notFound();
  if (league.operatorId !== session.user.id && session.user.role !== "SUPER_ADMIN") notFound();

  const pending = league.registrations.filter((r) => r.status === "PENDING");
  const approved = league.registrations.filter((r) => r.status === "APPROVED");
  const rejected = league.registrations.filter((r) => r.status === "REJECTED");

  return (
    <div className="px-4 py-5 pb-20 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/operator/league/${id}`} className="p-2 hover:bg-muted rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Registrations</h1>
          <p className="text-sm text-muted-foreground">{league.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-yellow-600">{pending.length}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-green-600">{approved.length}</p>
          <p className="text-xs text-muted-foreground">Approved</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-red-600">{rejected.length}</p>
          <p className="text-xs text-muted-foreground">Rejected</p>
        </Card>
      </div>

      {pending.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Pending Approval ({pending.length})</h2>
          <div className="space-y-2">
            {pending.map((reg) => (
              <Card key={reg.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-brand rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {reg.player.name[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{reg.player.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {reg.player.email}
                      {reg.player.city && ` · ${reg.player.city}`}
                    </p>
                  </div>
                </div>
                <RegistrationActions registrationId={reg.id} />
              </Card>
            ))}
          </div>
        </div>
      )}

      {approved.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Approved ({approved.length})</h2>
          <Card>
            <div className="space-y-2">
              {approved.map((reg) => (
                <div key={reg.id} className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium">{reg.player.name}</p>
                    <p className="text-xs text-muted-foreground">{reg.player.email}</p>
                  </div>
                  <span className="text-xs text-green-700 font-medium">Approved</span>
                </div>
              ))}
            </div>
          </Card>
          {league.mode === "TEAM" && (
            <p className="text-xs text-muted-foreground mt-2">
              Go to <Link href={`/dashboard/operator/league/${id}/teams`} className="text-brand font-medium hover:underline">Teams</Link> to assign approved players to teams and set captains.
            </p>
          )}
        </div>
      )}

      {rejected.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Rejected ({rejected.length})</h2>
          <Card>
            <div className="space-y-2">
              {rejected.map((reg) => (
                <div key={reg.id} className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium">{reg.player.name}</p>
                    <p className="text-xs text-muted-foreground">{reg.player.email}</p>
                  </div>
                  <span className="text-xs text-red-600 font-medium">Rejected</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {league.registrations.length === 0 && (
        <Card>
          <p className="text-sm text-muted-foreground text-center py-8">No registrations yet</p>
        </Card>
      )}
    </div>
  );
}
