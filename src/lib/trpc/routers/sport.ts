import { z } from "zod";
import { router, publicProcedure, protectedProcedure, requireRole } from "../server";

export const sportRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.sport.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.sport.findUniqueOrThrow({
        where: { slug: input.slug },
      });
    }),

  create: protectedProcedure
    .use(requireRole("SUPER_ADMIN"))
    .input(
      z.object({
        name: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        icon: z.string().optional(),
        scoringConfig: z.any(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.sport.create({ data: input });
    }),
});
