// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { createServerSupabaseClient } from "./supabase";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const supabase = createServerSupabaseClient();

        // NOTE: table is "User" (matches register route), not "users"
        const { data: user, error } = await supabase
          .from("User")
          .select("id, email, name, role, image, passwordHash")
          .eq("email", credentials.email)
          .maybeSingle();

        if (error || !user) return null;
        if (!user.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? "",
          image: user.image ?? null,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    // ── signIn ──────────────────────────────────────────────────────────────
    async signIn({ user, account }) {
      if (!account || account.provider === "credentials") return true;

      // OAuth path (Google, etc.)
      const supabase = createServerSupabaseClient();

      try {
        const { data: dbUser, error } = await supabase
          .from("User")
          .select("id, name, image, role, allergies, chronicConditions")
          .eq("email", user.email!)
          .maybeSingle();

        if (error) {
          console.error("[auth/signIn] lookup failed:", error);
          return false;
        }

        // ── Brand-new Google sign-up: no User row yet, create everything ──
        if (!dbUser) {
          const newUserId = uuidv4();
          const now = new Date().toISOString();
          const role = "PATIENT"; // Google has no role picker; default here

          const { data: createdUser, error: createError } = await supabase
            .from("User")
            .insert({
              id: newUserId,
              name: user.name ?? "",
              email: user.email!,
              image: user.image ?? null,
              role,
              allergies: [],
              chronicConditions: [],
              timezone: "UTC",
              locale: "en",
              isVerified: true,
              createdAt: now,
              updatedAt: now,
            })
            .select("id, role")
            .single();

          if (createError || !createdUser) {
            console.error("[auth/signIn] failed to create OAuth user:", createError);
            return false;
          }

          await supabase.from("Account").insert({
            id: uuidv4(),
            userId: createdUser.id,
            type: "oauth",
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            createdAt: now,
            updatedAt: now,
          });

          await supabase.from("PatientProfile").insert({
            id: uuidv4(),
            userId: createdUser.id,
            preferredLanguage: "en",
            createdAt: now,
            updatedAt: now,
          });

          await supabase.from("Notification").insert({
            id: uuidv4(),
            userId: createdUser.id,
            type: "SYSTEM",
            title: "Welcome to VitaConnect!",
            message:
              "Your account is ready. Book your first consultation or connect your health devices.",
            createdAt: now,
            updatedAt: now,
          });

          (user as any).id = createdUser.id;
          (user as any).role = createdUser.role;
          return true;
        }

        // ── Existing user: keep profile fresh, backfill missing role profile ──
        await supabase
          .from("User")
          .update({
            name: dbUser.name || user.name || undefined,
            image: dbUser.image || user.image || undefined,
            isVerified: true,
            allergies: dbUser.allergies?.length ? undefined : [],
            chronicConditions: dbUser.chronicConditions?.length ? undefined : [],
            updatedAt: new Date().toISOString(),
          })
          .eq("id", dbUser.id);

        const [{ data: patientProfile }, { data: doctorProfile }] = await Promise.all([
          supabase.from("PatientProfile").select("id").eq("userId", dbUser.id).maybeSingle(),
          supabase.from("DoctorProfile").select("id").eq("userId", dbUser.id).maybeSingle(),
        ]);

        const backfillNow = new Date().toISOString();

        if (dbUser.role === "DOCTOR" && !doctorProfile) {
          await supabase.from("DoctorProfile").insert({
            id: uuidv4(),
            userId: dbUser.id,
            licenseNumber: `LIC-PENDING-${Date.now()}`,
            specializations: [],
            consultationFee: 0,
            isAvailableNow: false,
            createdAt: backfillNow,
            updatedAt: backfillNow,
          });
        } else if (dbUser.role === "PATIENT" && !patientProfile) {
          await supabase.from("PatientProfile").insert({
            id: uuidv4(),
            userId: dbUser.id,
            preferredLanguage: "en",
            createdAt: backfillNow,
            updatedAt: backfillNow,
          });
        }

        (user as any).id = dbUser.id;
        (user as any).role = dbUser.role;
      } catch (err) {
        console.error("[auth/signIn callback]", err);
        return false;
      }

      return true;
    },

    // ── jwt ─────────────────────────────────────────────────────────────────
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "PATIENT";
      }
      return token;
    },

    // ── session ─────────────────────────────────────────────────────────────
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  events: {
    // Audit log on every sign-in
    async signIn({ user }) {
      if (!user.id) return;

      const supabase = createServerSupabaseClient();

      await supabase.from("AuditLog").insert({
        id: uuidv4(),
        userId: user.id,
        action: "SIGN_IN",
        resource: "auth",
        createdAt: new Date().toISOString(),
      });
    },
  },
};