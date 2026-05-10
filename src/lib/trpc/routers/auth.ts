import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../server";
import bcrypt from "bcryptjs";

export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100),
        email: z.string().email(),
        password: z.string().min(6).max(128),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          phone: input.phone || null,
          role: "PLAYER",
        },
      });

      return { id: user.id, email: user.email };
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        bio: true,
        dateOfBirth: true,
        gender: true,
        city: true,
        state: true,
        onboardingDone: true,
        favoriteSports: true,
        createdAt: true,
      },
    });
  }),

  checkOnboarding: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { onboardingDone: true },
    });
    return { onboardingDone: user?.onboardingDone ?? false };
  }),

  checkNeedsPassword: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { passwordHash: true },
    });
    return { needsPassword: !user?.passwordHash };
  }),

  completeOnboarding: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100),
        dateOfBirth: z.string(),
        gender: z.enum(["MALE", "FEMALE", "OTHER"]),
        favoriteSports: z.array(z.string()).default([]),
        city: z.string().min(1).max(100),
        state: z.string().max(100).optional(),
        password: z.string().min(6).max(128).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dob = new Date(input.dateOfBirth);
      if (isNaN(dob.getTime())) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid date of birth" });
      }

      // Age validation: must be at least 5 years old (exact calculation)
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const hadBirthday = today.getMonth() > dob.getMonth() ||
        (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
      if (!hadBirthday) age--;
      if (age < 5 || age > 120) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You must be at least 5 years old" });
      }
      if (dob > today) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Date of birth cannot be in the future" });
      }

      const data: Record<string, unknown> = {
        name: input.name,
        dateOfBirth: dob,
        gender: input.gender,
        favoriteSports: input.favoriteSports,
        city: input.city,
        state: input.state || null,
        onboardingDone: true,
      };

      // Set password if provided (Google users setting password for first time)
      if (input.password) {
        data.passwordHash = await bcrypt.hash(input.password, 12);
      }

      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data,
      });
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100).optional(),
        bio: z.string().max(500).optional(),
        city: z.string().max(100).optional(),
        state: z.string().max(100).optional(),
        phone: z.string().max(20).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Handle empty phone — set to null
      const phone = input.phone?.trim() || null;

      // Check phone uniqueness if changing
      if (phone) {
        const existing = await ctx.db.user.findFirst({
          where: { phone, id: { not: ctx.session.user.id } },
        });
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "This phone number is already registered to another account" });
        }
      }

      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          ...input,
          phone,
        },
      });
    }),
});
