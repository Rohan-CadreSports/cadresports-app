import { TRPCError } from "@trpc/server";
import type { db as DB } from "@/lib/db";

export async function verifyLeagueOwnership(
  db: typeof DB,
  leagueId: string,
  userId: string,
  userRole: string
) {
  if (userRole === "SUPER_ADMIN") return;
  const league = await db.league.findUnique({
    where: { id: leagueId },
    select: { operatorId: true },
  });
  if (!league) throw new TRPCError({ code: "NOT_FOUND", message: "League not found" });
  if (league.operatorId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You are not the operator of this league" });
  }
}

export async function verifyDivisionOwnership(
  db: typeof DB,
  divisionId: string,
  userId: string,
  userRole: string
) {
  if (userRole === "SUPER_ADMIN") return;
  const division = await db.division.findUnique({
    where: { id: divisionId },
    include: { league: { select: { operatorId: true } } },
  });
  if (!division) throw new TRPCError({ code: "NOT_FOUND", message: "Division not found" });
  if (division.league.operatorId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You are not the operator of this league" });
  }
}

export async function verifyTeamOwnership(
  db: typeof DB,
  teamId: string,
  userId: string,
  userRole: string
) {
  if (userRole === "SUPER_ADMIN") return;
  const team = await db.team.findUnique({
    where: { id: teamId },
    include: { division: { include: { league: { select: { operatorId: true } } } } },
  });
  if (!team) throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
  if (team.division.league.operatorId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You are not the operator of this league" });
  }
}

export async function verifyTieOwnership(
  db: typeof DB,
  tieId: string,
  userId: string,
  userRole: string
) {
  if (userRole === "SUPER_ADMIN") return;
  const tie = await db.tie.findUnique({
    where: { id: tieId },
    include: { division: { include: { league: { select: { operatorId: true } } } } },
  });
  if (!tie) throw new TRPCError({ code: "NOT_FOUND", message: "Tie not found" });
  if (tie.division.league.operatorId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You are not the operator of this league" });
  }
}

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["REGISTRATION_OPEN", "CANCELLED"],
  REGISTRATION_OPEN: ["REGISTRATION_CLOSED", "CANCELLED"],
  REGISTRATION_CLOSED: ["IN_PROGRESS", "REGISTRATION_OPEN"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function validateStatusTransition(current: string, next: string): boolean {
  return VALID_STATUS_TRANSITIONS[current]?.includes(next) ?? false;
}
