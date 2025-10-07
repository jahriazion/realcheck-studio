import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const chat = await prisma.chat.findUnique({ where: { id: params.id } });
  if (!chat || chat.userId !== (session as any).user.id) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  const messages = await prisma.message.findMany({ where: { chatId: chat.id }, orderBy: { index: "asc" } });
  return NextResponse.json({ ok: true, chat: { id: chat.id, title: chat.title }, messages });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const chat = await prisma.chat.findUnique({ where: { id: params.id } });
  if (!chat || chat.userId !== (session as any).user.id) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  await prisma.message.deleteMany({ where: { chatId: chat.id } });
  await prisma.chat.delete({ where: { id: chat.id } });
  return NextResponse.json({ ok: true });
}
