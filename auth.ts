import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { auth, handlers, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const u = await prisma.user.findUnique({ where: { email: creds.email } });
        if (!u?.passwordHash) return null;
        const ok = await bcrypt.compare(creds.password, u.passwordHash);
        return ok ? { id: u.id, email: u.email ?? "", name: u.name ?? "" } : null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) { if (user) token.uid = (user as any).id; return token; },
    async session({ session, token }) { if (token?.uid) (session as any).user.id = token.uid as string; return session; },
  },
});
