import { prisma } from "@/lib/prisma";

export async function isUserPro(userId: string) {
  if (process.env.RC_DEV_ALL_PRO === "true") return true;
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { subscriptionStatus: true } });
  return u?.subscriptionStatus === "active";
}
