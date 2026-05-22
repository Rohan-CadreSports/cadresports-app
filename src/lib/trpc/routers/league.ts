import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure, requireRole } from "../server";
import { slugify } from "@/lib/utils";
import {
  generateRoundRobinRound,
  generateKnockout,
  getTotalRoundsRR,
  getTotalRoundsDoubleRR,
} from "@/lib/tournament/fixture-generator";
import { verifyLeagueOwnership, verifyDivisionOwnership, validateStatusTransition } from "./_helpers";

export const leagueRouter = router({
  list: publicProcedure
    .input(
      z.object({
        city: z.string().optional(),
        sportSlug: z.string().optional(),
        status: z.enum(["DRAFT", "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
        genderFilter: z.enum(["OPEN", "MENS_ONLY", "WOMENS_ONLY"]).optional(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input?.city) where.city = { equals: input.city, mode: "insensitive" };
      if (input?.sportSlug) where.sport = { slug: input.sportSlug };
      if (input?.status) where.status = input.status;

      // Gender filter: exclude leagues that don't match
      if (input?.genderFilter) {
        if (input.genderFilter === "MENS_ONLY") {
          where.genderRestriction = { in: ["OPEN", "MENS_ONLY"] };
        } else if (input.genderFilter === "WOMENS_ONLY") {
          where.genderRestriction = { in: ["OPEN", "WOMENS_ONLY"] };
        }
      }

      const leagues = await ctx.db.league.findMany({
        where,
        take: (input?.limit ?? 20) + 1,
        cursor: input?.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          sport: { select: { name: true, slug: true, icon: true } },
          operator: { select: { name: true } },
          _count: { select: { registrations: true, divisions: true } },
        },
      });

      let nextCursor: string | undefined;
      if (leagues.length > (input?.limit ?? 20)) {
        const next = leagues.pop();
        nextCursor = next?.id;
      }

      return { leagues, nextCursor };
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.league.findUniqueOrThrow({
        where: { slug: input.slug },
        include: {
          sport: true,
          operator: { select: { id: true, name: true } },
          divisions: {
            include: {
              teams: {
                include: {
                  captain: { select: { name: true } },
                  players: {
                    where: { isActive: true },
                    include: { player: { select: { name: true } } },
                  },
                  _count: { select: { players: true } },
                },
              },
            },
            orderBy: { order: "asc" },
          },
          _count: { select: { registrations: true } },
        },
      });
    }),

  // Super Admin creates leagues
  create: protectedProcedure
    .use(requireRole("SUPER_ADMIN"))
    .input(
      z.object({
        name: z.string().min(3).max(200),
        sportId: z.string(),
        operatorId: z.string(),
        structure: z.enum(["ROUND_ROBIN", "ROUND_ROBIN_DOUBLE", "TOURNAMENT", "HYBRID"]),
        mode: z.enum(["TEAM", "INDIVIDUAL"]).default("TEAM"),
        genderRestriction: z.enum(["OPEN", "MENS_ONLY", "WOMENS_ONLY"]).default("OPEN"),
        description: z.string().max(5000).optional(),
        imageUrl: z.string().max(2000).optional(),
        rules: z.string().optional(),
        city: z.string().min(1).max(100),
        state: z.string().max(100).optional(),
        venue: z.string().max(200).optional(),
        maxTeamsPerDiv: z.number().min(2).max(128).default(8),
        minTeamSize: z.number().min(1).max(30).default(2),
        maxTeamSize: z.number().min(1).max(30).default(10),
        matchConfig: z.object({
          singlesCount: z.number().min(0).max(10).optional(),
          doublesCount: z.number().min(0).max(10).optional(),
          matchesPerTie: z.number().min(1).max(10).optional(),
          playersPerSide: z.number().min(3).max(11).optional(),
          matchDuration: z.number().min(10).max(120).optional(),
        }).default({}),
        hybridTopN: z.number().min(2).max(32).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        registrationEnd: z.string().optional(),
        divisions: z.array(z.string().min(1).max(50)).min(1),
        federationId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify operator
      const operator = await ctx.db.user.findUniqueOrThrow({ where: { id: input.operatorId } });
      if (operator.role !== "TOURNAMENT_OPERATOR" && operator.role !== "SUPER_ADMIN") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Selected user is not a Tournament Operator" });
      }

      // Validate dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (input.registrationEnd) {
        const regEnd = new Date(input.registrationEnd);
        if (regEnd < today) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Registration deadline must be today or later" });
        }
      }
      if (input.startDate && input.registrationEnd) {
        if (new Date(input.startDate) <= new Date(input.registrationEnd)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Start date must be after registration deadline" });
        }
      }
      if (input.endDate && input.startDate) {
        if (new Date(input.endDate) <= new Date(input.startDate)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "End date must be after start date" });
        }
      }

      // Validate match config
      const sc = input.matchConfig.singlesCount ?? 0;
      const dc = input.matchConfig.doublesCount ?? 0;
      const pps = input.matchConfig.playersPerSide ?? 0;
      const mpt = input.matchConfig.matchesPerTie ?? (sc + dc || 1);
      if (mpt < 1) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Must have at least 1 match per tie" });
      }
      if (input.mode === "TEAM" && mpt > 1 && mpt % 2 === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Total matches per tie must be an odd number for team mode" });
      }

      // Validate min team size against match config
      if (pps > 0 && input.minTeamSize < pps) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Minimum team size cannot be less than ${pps} (players per side)` });
      }
      const minFromMatches = Math.max(sc, dc * 2);
      if (minFromMatches > 0 && input.minTeamSize < minFromMatches) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Minimum team size must be at least ${minFromMatches} based on match config` });
      }

      const slug = slugify(input.name) + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

      return ctx.db.league.create({
        data: {
          name: input.name,
          slug,
          sportId: input.sportId,
          operatorId: input.operatorId,
          createdById: ctx.session.user.id,
          federationId: input.federationId || null,
          structure: input.structure,
          mode: input.mode,
          genderRestriction: input.genderRestriction,
          description: input.description,
          imageUrl: input.imageUrl || null,
          rules: input.rules,
          city: input.city,
          state: input.state || null,
          venue: input.venue || null,
          maxTeamsPerDiv: input.maxTeamsPerDiv,
          minTeamSize: input.minTeamSize,
          maxTeamSize: input.maxTeamSize,
          matchConfig: input.matchConfig,
          hybridTopN: input.hybridTopN,
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
          registrationEnd: input.registrationEnd ? new Date(input.registrationEnd) : null,
          status: "DRAFT",
          divisions: {
            create: input.divisions.map((name, idx) => ({ name, order: idx })),
          },
        },
        include: { divisions: true },
      });
    }),

  // TO sees only assigned leagues
  myAssignedLeagues: protectedProcedure
    .use(requireRole("TOURNAMENT_OPERATOR"))
    .query(async ({ ctx }) => {
      return ctx.db.league.findMany({
        where: { operatorId: ctx.session.user.id },
        include: {
          sport: { select: { name: true, slug: true, icon: true } },
          _count: { select: { registrations: true, divisions: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Reassign TO
  reassignOperator: protectedProcedure
    .use(requireRole("SUPER_ADMIN"))
    .input(z.object({ leagueId: z.string(), newOperatorId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const op = await ctx.db.user.findUniqueOrThrow({ where: { id: input.newOperatorId } });
      if (op.role !== "TOURNAMENT_OPERATOR" && op.role !== "SUPER_ADMIN") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "User is not a Tournament Operator" });
      }
      return ctx.db.league.update({
        where: { id: input.leagueId },
        data: { operatorId: input.newOperatorId },
      });
    }),

  updateImage: protectedProcedure
    .use(requireRole("TOURNAMENT_OPERATOR"))
    .input(
      z.object({
        leagueId: z.string(),
        imageUrl: z.string().max(2000).or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyLeagueOwnership(ctx.db, input.leagueId, ctx.session.user.id, ctx.session.user.role);
      return ctx.db.league.update({
        where: { id: input.leagueId },
        data: { imageUrl: input.imageUrl || null },
      });
    }),

  updateStatus: protectedProcedure
    .use(requireRole("TOURNAMENT_OPERATOR"))
    .input(
      z.object({
        leagueId: z.string(),
        status: z.enum(["DRAFT", "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyLeagueOwnership(ctx.db, input.leagueId, ctx.session.user.id, ctx.session.user.role);

      const league = await ctx.db.league.findUniqueOrThrow({ where: { id: input.leagueId } });

      if (!validateStatusTransition(league.status, input.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot transition from ${league.status} to ${input.status}`,
        });
      }

      return ctx.db.league.update({
        where: { id: input.leagueId },
        data: { status: input.status },
      });
    }),

  // Generate next round of ties for a division (round-by-round RR)
  generateNextRound: protectedProcedure
    .use(requireRole("TOURNAMENT_OPERATOR"))
    .input(z.object({ leagueId: z.string(), divisionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await verifyDivisionOwnership(ctx.db, input.divisionId, ctx.session.user.id, ctx.session.user.role);

      const division = await ctx.db.division.findUniqueOrThrow({
        where: { id: input.divisionId },
        include: {
          league: true,
          teams: true,
          ties: { select: { homeTeamId: true, awayTeamId: true, round: true, status: true } },
        },
      });

      const league = division.league;
      if (league.status !== "IN_PROGRESS") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "League must be IN_PROGRESS to generate rounds" });
      }

      if (division.teams.length < 2) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Need at least 2 teams" });
      }

      // Check if current round is complete
      const currentRound = league.currentRound;
      if (currentRound > 0) {
        const unfinished = division.ties.filter(
          (t) => t.round === currentRound && t.status !== "COMPLETED" && t.status !== "WALKOVER"
        );
        if (unfinished.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Round ${currentRound} has ${unfinished.length} unfinished tie(s). Complete them first.`,
          });
        }
      }

      const nextRound = currentRound + 1;
      const totalRounds = league.structure === "ROUND_ROBIN_DOUBLE"
        ? getTotalRoundsDoubleRR(division.teams.length)
        : getTotalRoundsRR(division.teams.length);

      if (nextRound > totalRounds) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "All rounds have been generated" });
      }

      // Build played-opponents map from existing ties
      // For RR 2.0: track DIRECTIONAL matchups (home vs away is different from away vs home)
      // For regular RR: track both directions
      const isDouble = league.structure === "ROUND_ROBIN_DOUBLE";
      const played = new Map<number, Set<number>>();
      const teamIndexMap = new Map<string, number>();
      division.teams.forEach((t, i) => teamIndexMap.set(t.id, i));

      for (const tie of division.ties) {
        const hIdx = teamIndexMap.get(tie.homeTeamId);
        const aIdx = teamIndexMap.get(tie.awayTeamId);
        if (hIdx !== undefined && aIdx !== undefined) {
          // Always track home -> away direction
          const hSet = played.get(hIdx) ?? new Set();
          hSet.add(aIdx);
          played.set(hIdx, hSet);

          // For regular RR: also track reverse direction (prevents any rematch)
          // For RR 2.0: DON'T track reverse — allows the return fixture
          if (!isDouble) {
            const aSet = played.get(aIdx) ?? new Set();
            aSet.add(hIdx);
            played.set(aIdx, aSet);
          }
        }
      }

      const fixtures = generateRoundRobinRound(division.teams.length, nextRound, played, isDouble);

      // Parse match config
      const mc = league.matchConfig as { singlesCount?: number; doublesCount?: number; matchesPerTie?: number };
      const singlesCount = mc.singlesCount ?? 0;
      const doublesCount = mc.doublesCount ?? 0;
      const matchesPerTie = mc.matchesPerTie ?? (singlesCount + doublesCount || 1);

      // Create ties with sub-matches
      const teamCount = division.teams.length;
      let tieCount = 0;

      for (const f of fixtures) {
        if (f.homeTeamIndex < 0 || f.awayTeamIndex < 0) continue;
        if (f.homeTeamIndex >= teamCount || f.awayTeamIndex >= teamCount) continue;

        const matchData: { matchNumber: number; format: "SINGLES" | "DOUBLES" }[] = [];
        let mn = 1;
        for (let s = 0; s < singlesCount; s++) {
          matchData.push({ matchNumber: mn++, format: "SINGLES" });
        }
        for (let d = 0; d < doublesCount; d++) {
          matchData.push({ matchNumber: mn++, format: "DOUBLES" });
        }
        // Fallback for sports with simple matchesPerTie
        if (matchData.length === 0) {
          for (let m = 0; m < matchesPerTie; m++) {
            matchData.push({ matchNumber: mn++, format: "SINGLES" });
          }
        }

        await ctx.db.tie.create({
          data: {
            divisionId: input.divisionId,
            homeTeamId: division.teams[f.homeTeamIndex].id,
            awayTeamId: division.teams[f.awayTeamIndex].id,
            round: nextRound,
            tieNumber: f.tieNumber,
            matches: {
              create: matchData,
            },
          },
        });
        tieCount++;
      }

      // Update league current round
      await ctx.db.league.update({
        where: { id: input.leagueId },
        data: {
          currentRound: nextRound,
          totalRounds: totalRounds,
        },
      });

      // Initialize standings if first round
      if (nextRound === 1) {
        await Promise.all(
          division.teams.map((team) =>
            ctx.db.standing.upsert({
              where: { divisionId_teamId: { divisionId: input.divisionId, teamId: team.id } },
              create: { divisionId: input.divisionId, teamId: team.id },
              update: {},
            })
          )
        );
      }

      return { round: nextRound, tieCount, totalRounds };
    }),
});
