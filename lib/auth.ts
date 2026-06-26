// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as never,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error:  "/auth/error",
  },

  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id:    user.id,
          email: user.email,
          name:  user.name  ?? "",
          image: user.image ?? null,
          role:  user.role,
        };
      },
    }),
  ],

  callbacks: {
    // ── signIn ──────────────────────────────────────────────────────────────
    // Runs for EVERY sign-in. For OAuth we ensure the PatientProfile row
    // exists and that name/image from the provider are persisted to User.
    // Credentials users are already fully set up by /api/auth/register.
    async signIn({ user, account }) {
      // Let credentials flow through untouched
      if (!account || account.provider === "credentials") return true;

      // OAuth path — PrismaAdapter has already upserted the User row,
      // but it won't have created the PatientProfile or set array defaults.
      try {
        const dbUser = await prisma.user.findUnique({
          where:  { email: user.email! },
          select: {
            id:                true,
            name:              true,
            image:             true,
            allergies:         true,
            chronicConditions: true,
            patientProfile:    { select: { id: true } },
          },
        });

        if (!dbUser) return false;

        // Backfill name/image from provider if still null in DB, and ensure
        // array fields are never null so the profile page always gets [].
        await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            name:              dbUser.name  ?? user.name  ?? undefined,
            image:             dbUser.image ?? user.image ?? undefined,
            isVerified:        true,
            // Only overwrite if currently empty — preserves any manual edits
            allergies:         dbUser.allergies.length         ? undefined : [],
            chronicConditions: dbUser.chronicConditions.length ? undefined : [],
          },
        });

        // First-ever OAuth login — create profile row + welcome notification
        if (!dbUser.patientProfile) {
          await prisma.$transaction([
            prisma.patientProfile.create({
              data: { userId: dbUser.id, preferredLanguage: "en" },
            }),
            prisma.notification.create({
              data: {
                userId:  dbUser.id,
                type:    "SYSTEM",
                title:   "Welcome to VitaConnect!",
                message: "Your account is ready. Book your first consultation or connect your health devices.",
              },
            }),
          ]);
        }
      } catch (err) {
        console.error("[auth/signIn callback]", err);
        return false;
      }

      return true;
    },

    // ── jwt ─────────────────────────────────────────────────────────────────
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as { role?: string }).role ?? "PATIENT";
      }
      return token;
    },

    // ── session ─────────────────────────────────────────────────────────────
    async session({ session, token }) {
      session.user.id   = token.id   as string;
      session.user.role = token.role as string;
      return session;
    },
  },

  events: {
    // Audit log on every sign-in (credentials + OAuth)
    async signIn({ user }) {
      if (!user.id) return;
      await prisma.auditLog.create({
        data: {
          userId:   user.id,
          action:   "SIGN_IN",
          resource: "auth",
        },
      });
    },
  },
};