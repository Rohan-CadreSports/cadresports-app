import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, requireRole } from "../server";
import { verifyLeagueOwnership, verifyTeamOwnership } from "./_helpers";

export const registrationRouter = router({
  register: protectedProcedure
    .input(
      z.object({
        leagueId: z.string(),
        teamPreference: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only players can register for leagues (captaincy is per-team, not a role)
      if (ctx.session.user.role !== "PLAYER") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only players can register for leagues" });
      }

      // Must complete onboarding first
      const user = await ctx.db.user.findUniqueOrThrow({
        where: { id: ctx.session.user.id },
        select: { onboardingDone: true, gender: true, city: true },
      });
      if (!user.onboardingDone) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Please complete your profile before registering" });
      }

      const league = await ctx.db.league.findUniqueOrThrow({
        where: { id: input.leagueId },
        include: {
          divisions: {
            include: { teams: { select: { id: true } } },
          },
        },
      });

      if (league.status !== "REGISTRATION_OPEN") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Registration is not open for this league" });
      }

      // Check registration deadline
      if (league.registrationEnd && new Date() > league.registrationEnd) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Registration deadline has passed" });
      }

      // Gender restriction check
      if (league.genderRestriction === "MENS_ONLY" && user.gender !== "MALE") {
        throw new TRPCError({ code: "FORBIDDEN", message: "This league is for men only" });
      }
      if (league.genderRestriction === "WOMENS_ONLY" && user.gender !== "FEMALE") {
        throw new TRPCError({ code: "FORBIDDEN", message: "This league is for women only" });
      }

      // Check if already registered (allow re-registration if previously rejected)
      const existingReg = await ctx.db.playerRegistration.findUnique({
        where: {
          leagueId_playerId: {
            leagueId: input.leagueId,
            playerId: ctx.session.user.id,
          },
        },
      });
      if (existingReg) {
        if (existingReg.status === "REJECTED") {
          // Delete old rejected registration so they can re-apply
          await ctx.db.playerRegistration.delete({
            where: { id: existingReg.id },
          });
        } else {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You are already registered for this league" });
        }
      }

      // Check if already in a team in this league
      const teamIds = league.divisions.flatMap((d) => d.teams.map((t) => t.id));
      if (teamIds.length > 0) {
        const existing = await ctx.db.teamPlayer.findFirst({
          where: {
            playerId: ctx.session.user.id,
            teamId: { in: teamIds },
          },
        });
        if (existing) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You are already part of a team in this league" });
        }
      }

      return ctx.db.playerRegistration.create({
        data: {
          leagueId: input.leagueId,
          playerId: ctx.session.user.id,
          teamPreference: input.teamPreference,
          notes: input.notes,
        },
      });
    }),

  updateStatus: protectedProcedure
    .use(requireRole("TOURNAMENT_OPERATOR"))
    .input(
      z.object({
        registrationId: z.string(),
        status: z.enum(["PENDING", "APPROVED", "REJECTED", "WAITLISTED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.db.playerRegistration.findUniqueOrThrow({
        where: { id: input.registrationId },
      });

      await verifyLeagueOwnership(ctx.db, reg.leagueId, ctx.session.user.id, ctx.session.user.role);

      return ctx.db.playerRegistration.update({
        where: { id: input.registrationId },
        data: { status: input.status },
      });
    }),

  approveAndAssignTeam: protectedProcedure
    .use(requireRole("TOURNAMENT_OPERATOR"))
    .input(
      z.object({
        registrationId: z.string(),
        teamId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.db.playerRegistration.findUniqueOrThrow({
        where: { id: input.registrationId },
      });

      await verifyLeagueOwnership(ctx.db, reg.leagueId, ctx.session.user.id, ctx.session.user.role);

      // Verify team belongs to same league
      const team = await ctx.db.team.findUniqueOrThrow({
        where: { id: input.teamId },
        include: { division: { select: { leagueId: true, league: { select: { status: true } } } } },
      });

      if (team.division.leagueId !== reg.leagueId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Team does not belong to this league" });
      }

      // Roster lock — can't assign to team after registration closes (except Super Admin)
      const lockedStatuses = ["REGISTRATION_CLOSED", "IN_PROGRESS", "COMPLETED"];
      if (lockedStatuses.includes(team.division.league.status) && ctx.session.user.role !== "SUPER_ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Roster is locked after registration closes" });
      }

      await ctx.db.playerRegistration.update({
        where: { id: input.registrationId },
        data: { status: "APPROVED" },
      });

      const existing = await ctx.db.teamPlayer.findUnique({
        where: {
          teamId_playerId: { teamId: input.teamId, playerId: reg.playerId },
        },
      });

      if (!existing) {
        await ctx.db.teamPlayer.create({
          data: {
            teamId: input.teamId,
            playerId: reg.playerId,
          },
        });
      }

      return { success: true };
    }),

  // Only league operator or admin can view registrations
  getByLeague: protectedProcedure
    .use(requireRole("TOURNAMENT_OPERATOR"))
    .input(z.object({ leagueId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyLeagueOwnership(ctx.db, input.leagueId, ctx.session.user.id, ctx.session.user.role);

      return ctx.db.playerRegistration.findMany({
        where: { leagueId: input.leagueId },
        include: {
          player: {
            select: { id: true, name: true, email: true, phone: true, image: true },
          },
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  myRegistrations: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.playerRegistration.findMany({
      where: { playerId: ctx.session.user.id },
      include: {
        league: {
          include: {
            sport: { select: { name: true, slug: true, icon: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),
});
