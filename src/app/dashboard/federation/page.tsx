export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Trophy, Users } from "lucide-react";

export default async function FederationDashboard() {
  const session = await requireRole("FEDERATION_ADMIN");

  const federationAdmins = await db.federationAdmin.findMany({
    where: { userId: session.user.id },
    include: {
      federation: {
        include: {
          sport: { select: { name: true, icon: true } },
          leagues: {
            include: {
              operator: { select: { name: true } },
              _count: { select: { registrations: true, divisions: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  return (
    <div className="px-4 py-5 pb-20 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Federation Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Oversight for your assigned federations
        </p>
      </div>

      {federationAdmins.map((fa) => (
        <div key={fa.id} className="space-y-4">
          <Card className="bg-brand/5 border-brand/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand/10 rounded-[8px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-brand" />
              </div>
              <div>
                <CardTitle>{fa.federation.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {fa.federation.sport.name} &middot; {fa.federation.level} &middot; {fa.federation.area}
                </p>
              </div>
            </div>
          </Card>

          <h3 className="text-md font-semibold">
            Leagues ({fa.federation.leagues.length})
          </h3>

          {fa.federation.leagues.length === 0 ? (
            <Card>
              <p className="text-sm text-muted-foreground text-center py-4">
                No leagues under this federation yet
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {fa.federation.leagues.map((league) => (
                <Card key={league.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{league.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Operated by {league.operator.name} &middot;{" "}
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3 h-3" /> {league._count.registrations}
                        </span>{" "}
                        &middot;{" "}
                        <span className="inline-flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> {league._count.divisions} div
                        </span>
                      </p>
                    </div>
                    <Badge
                      variant={
                        league.status === "IN_PROGRESS" ? "success" :
                        league.status === "REGISTRATION_OPEN" ? "info" :
                        "default"
                      }
                    >
                      {league.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
