import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, requireRole } from "../server";
import bcrypt from "bcryptjs";

export const adminRouter = router({
  // Create Tournament Operator (admin fills credentials directly)
  createOperator: protectedProcedure
    .use(requireRole("SUPER_ADMIN"))
    .input(
      z.object({
        name: z.string().min(2).max(100),
        email: z.string().email(),
        password: z.string().min(6).max(128),
        phone: z.string().max(20).optional(),
        city: z.string().max(100).optional(),
        state: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({ where: { email: input.email } });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      return ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          phone: input.phone || null,
          city: input.city || null,
          state: input.state || null,
          role: "TOURNAMENT_OPERATOR",
          onboardingDone: true,
        },
      });
    }),

  listOperators: protectedProcedure
    .use(requireRole("SUPER_ADMIN"))
    .query(async ({ ctx }) => {
      return ctx.db.user.findMany({
        where: { role: "TOURNAMENT_OPERATOR" },
        select: { id: true, name: true, email: true, city: true },
        orderBy: { name: "asc" },
      });
    }),

  listUsers: protectedProcedure
    .use(requireRole("SUPER_ADMIN"))
    .input(
      z.object({
        role: z.enum(["PLAYER", "TEAM_CAPTAIN", "TOURNAMENT_OPERATOR", "FEDERATION_ADMIN", "SUPER_ADMIN"]).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input?.role) where.role = input.role;
      if (input?.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { email: { contains: input.search, mode: "insensitive" } },
        ];
      }

      return ctx.db.user.findMany({
        where,
        take: input?.limit ?? 50,
        cursor: input?.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          city: true,
          state: true,
          gender: true,
          createdAt: true,
        },
      });
    }),

  updateUserRole: protectedProcedure
    .use(requireRole("SUPER_ADMIN"))
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["PLAYER", "TEAM_CAPTAIN", "TOURNAMENT_OPERATOR", "FEDERATION_ADMIN", "SUPER_ADMIN"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });
    }),

  createFederation: protectedProcedure
    .use(requireRole("SUPER_ADMIN"))
    .input(
      z.object({
        name: z.string().min(2),
        sportId: z.string(),
        level: z.enum(["DISTRICT", "STATE", "NATIONAL"]),
        area: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.federation.create({ data: input });
    }),

  assignFederationAdmin: protectedProcedure
    .use(requireRole("SUPER_ADMIN"))
    .input(z.object({ userId: z.string(), federationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: "FEDERATION_ADMIN" },
      });
      return ctx.db.federationAdmin.create({
        data: { userId: input.userId, federationId: input.federationId },
      });
    }),

  listAllLeagues: protectedProcedure
    .use(requireRole("SUPER_ADMIN"))
    .query(async ({ ctx }) => {
      return ctx.db.league.findMany({
        include: {
          sport: { select: { name: true, slug: true, icon: true } },
          operator: { select: { id: true, name: true } },
          _count: { select: { registrations: true, divisions: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    }),

  getDashboardStats: protectedProcedure
    .use(requireRole("SUPER_ADMIN"))
    .query(async ({ ctx }) => {
      const [users, leagues, activeLeagues, sports, operators] = await Promise.all([
        ctx.db.user.count(),
        ctx.db.league.count(),
        ctx.db.league.count({ where: { status: "IN_PROGRESS" } }),
        ctx.db.sport.count({ where: { isActive: true } }),
        ctx.db.user.count({ where: { role: "TOURNAMENT_OPERATOR" } }),
      ]);
      return { users, leagues, activeLeagues, sports, operators };
    }),

  // Federations for league creation dropdown (filtered by sport)
  listFederations: protectedProcedure
    .use(requireRole("SUPER_ADMIN"))
    .input(z.object({ sportId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { isActive: true };
      if (input?.sportId) where.sportId = input.sportId;
      return ctx.db.federation.findMany({
        where,
        include: { sport: { select: { name: true } } },
        orderBy: { name: "asc" },
      });
    }),
});
