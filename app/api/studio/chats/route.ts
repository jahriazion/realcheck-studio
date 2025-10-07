import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const chats = await prisma.chat.findMany({
    where: { userId: (session as any).user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });
  return NextResponse.json({ ok: true, chats });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const chat = await prisma.chat.create({
    data: { title: "New chat", userId: (session as any).user.id },
  });
  return NextResponse.json({ ok: true, chat });
}
