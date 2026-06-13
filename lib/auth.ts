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
    // ✅ NO signUp here — NextAuth doesn't support that key.
    // Registration is handled by /api/auth/register independently.
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
        email:    { label: "Email",    type: "email" },
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
          name:  user.name ?? "",
          image: user.image ?? null,
          role:  user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as { role?: string }).role ?? "PATIENT";
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id   = token.id   as string;
      session.user.role = token.role as string;
      return session;
    },
  },

  events: {
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