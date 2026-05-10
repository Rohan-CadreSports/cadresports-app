import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import type { UserRole } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
      role: UserRole;
      phone?: string | null;
    };
  }

  interface User {
    role: UserRole;
    phone?: string | null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          phone: user.phone,
        };
      },
    }),
    Credentials({
      id: "phone",
      name: "Phone OTP",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) return null;

        // Dummy OTP verification: any 6-digit code works for now
        const otp = credentials.otp as string;
        if (otp.length !== 6 || !/^\d{6}$/.test(otp)) return null;

        const phone = credentials.phone as string;
        let user = await db.user.findUnique({ where: { phone } });

        if (!user) {
          user = await db.user.create({
            data: {
              name: `Player ${phone.slice(-4)}`,
              email: `${phone}@phone.cadresport.local`,
              phone,
              role: "PLAYER",
            },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          phone: user.phone,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const existing = await db.user.findUnique({
          where: { email: user.email! },
        });

        if (!existing) {
          // Create user without password — they'll set it during onboarding
          const newUser = await db.user.create({
            data: {
              name: user.name!,
              email: user.email!,
              image: user.image,
              emailVerified: new Date(),
              role: "PLAYER",
              onboardingDone: false,
            },
          });
          await db.account.create({
            data: {
              userId: newUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
      }
      // On every token refresh, verify user still exists in DB
      if (token.id && trigger !== "signIn") {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { id: true, role: true, phone: true },
        });
        if (!dbUser) {
          // User was deleted (e.g. DB reset) — force re-login
          return { ...token, id: null };
        }
        token.role = dbUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      session.user.phone = token.phone as string | null;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: { strategy: "jwt" },
  trustHost: true,
});
