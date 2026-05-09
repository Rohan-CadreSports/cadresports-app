import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@/generated/prisma/client";

const ROLE_HIERARCHY: Record<UserRole, number> = {
  PLAYER: 0,
  TEAM_CAPTAIN: 1,
  TOURNAMENT_OPERATOR: 2,
  FEDERATION_ADMIN: 3,
  SUPER_ADMIN: 4,
};

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  return session;
}

export async function requireRole(minimumRole: UserRole) {
  const session = await requireAuth();
  if (ROLE_HIERARCHY[session.user.role] < ROLE_HIERARCHY[minimumRole]) {
    redirect("/unauthorized");
  }
  return session;
}

export async function requireAnyRole(...roles: UserRole[]) {
  const session = await requireAuth();
  if (!roles.includes(session.user.role)) {
    redirect("/unauthorized");
  }
  return session;
}

export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}
