import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { User } from "next-auth";

interface PrismaUser {
  id: string;
  email: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
  passwordHash: string | null;
}

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/signin",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds): Promise<User | null> {
        if (!creds?.email || !creds?.password) return null;
        try {
        const u = await (prisma.user.findUnique({ 
          where: { email: creds.email }
        }) as Promise<PrismaUser | null>);
        if (!u || !u.passwordHash) return null;
        const ok = await bcrypt.compare(creds.password, u.passwordHash);
        return ok ? { 
          id: u.id, 
          email: u.email ?? "", 
          name: u.name ?? "",
          firstName: u.firstName ?? "",
          lastName: u.lastName ?? "",
          isAdmin: u.isAdmin ?? false
        } : null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) { 
      if (user) {
        token.uid = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.isAdmin = user.isAdmin;
      }
      return token; 
    },
    async session({ session, token }: any) { 
      if (token?.uid) {
        session.user.id = token.uid as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session; 
    },
  },
};

export const { auth, handlers, signIn, signOut } = NextAuth(authOptions);
