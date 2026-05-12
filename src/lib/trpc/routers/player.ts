import { z } from "zod";
import { router, publicProcedure } from "../server";
import { TRPCError } from "@trpc/server";

export const playerRouter = router({
  // Public player profile — anyone can view
  getPublicProfile: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          image: true,
          bio: true,
          city: true,
          state: true,
          gender: true,
          role: true,
          favoriteSports: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Player not found" });
      }

      // Count leagues played (approved registrations)
      const leaguesPlayed = await ctx.db.playerRegistration.count({
        where: { playerId: input.id, status: "APPROVED" },
      });

      // Count matches played (lineup entries)
      const matchesPlayed = await ctx.db.lineupEntry.count({
        where: { playerId: input.id },
      });

      // Count wins — matches where the player's team won
      const wonLineupEntries = await ctx.db.lineupEntry.findMany({
        where: { playerId: input.id },
        select: {
          lineup: { select: { teamId: true } },
          match: { select: { winnerId: true } },
        },
      });

      const wins = wonLineupEntries.filter(
        (entry) => entry.match.winnerId && entry.match.winnerId === entry.lineup.teamId
      ).length;

      // Recent leagues
      const recentLeagues = await ctx.db.playerRegistration.findMany({
        where: { playerId: input.id, status: "APPROVED" },
        include: {
          league: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
              sport: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      return {
        ...user,
        stats: {
          leaguesPlayed,
          matchesPlayed,
          wins,
        },
        recentLeagues: recentLeagues.map((r) => r.league),
      };
    }),
});
