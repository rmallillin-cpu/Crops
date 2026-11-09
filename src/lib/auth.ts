import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { findAllowedUser } from "@/lib/sheets";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const user = await findAllowedUser(credentials.email);
          if (!user || user.status !== "active" || !user.passwordHash) return null;
          const valid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!valid) return null;
          return { id: user.email, email: user.email, name: user.name || user.email };
        } catch (err) {
          console.error("credentials authorize failed:", err);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
    error: "/unauthorized",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      try {
        const allowed = await findAllowedUser(user.email);
        return allowed !== null && allowed.status === "active";
      } catch (err) {
        console.error("signIn allow-list check failed:", err);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user?.email) {
        try {
          const allowed = await findAllowedUser(user.email);
          if (allowed) {
            token.role = allowed.role;
            token.lguSlug = allowed.lguSlug;
            token.displayName = allowed.name || user.name || user.email;
          }
        } catch (err) {
          console.error("jwt allow-list lookup failed:", err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role || "respondent";
        (session.user as any).lguSlug = token.lguSlug || "";
        (session.user as any).displayName = token.displayName || session.user.name;
      }
      return session;
    },
  },
};
