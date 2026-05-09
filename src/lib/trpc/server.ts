import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { UserRole } from "@/generated/prisma/client";

export const createTRPCContext = async () => {
  const session = await auth();
  return { db, session };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const enforceAuth = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

export const protectedProcedure = t.procedure.use(enforceAuth);

const ROLE_HIERARCHY: Record<UserRole, number> = {
  PLAYER: 0,
  TEAM_CAPTAIN: 0, // Same as PLAYER — captaincy is per-team, not a global role
  TOURNAMENT_OPERATOR: 2,
  FEDERATION_ADMIN: 3,
  SUPER_ADMIN: 4,
};

export function requireRole(minRole: UserRole) {
  return t.middleware(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    if (ROLE_HIERARCHY[ctx.session.user.role] < ROLE_HIERARCHY[minRole]) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
    }
    return next({ ctx: { ...ctx, session: ctx.session } });
  });
}
