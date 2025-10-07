import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { openai } from "@/lib/ai";
import { modelMap } from "@/lib/models";
import { isUserPro } from "@/lib/pro";

export async function POST(req: Request, { params }: { params: { id: string }}) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { content, model = "rc-mini" } = await req.json();
  if (!content || typeof content !== "string") return NextResponse.json({ ok: false, error: "missing content" }, { status: 400 });
  const chat = await prisma.chat.findUnique({ where: { id: params.id } });
  if (!chat || chat.userId !== (session as any).user.id) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  const idx = await prisma.message.count({ where: { chatId: chat.id } });
  await prisma.message.create({ data: { chatId: chat.id, role: "user", content, index: idx } });
  const messages = await prisma.message.findMany({ where: { chatId: chat.id }, orderBy: { index: "asc" } });

  const mapped = modelMap[(model as any)] ?? modelMap["rc-mini"];
  if (model === "rc-pro") {
    const pro = await isUserPro((session as any).user.id as string);
    if (!pro) return NextResponse.json({ ok: false, error: "upgrade_required" }, { status: 402 });
  }

  const completion = await openai.chat.completions.create({
    model: mapped.model,
    messages: messages.map(m => ({ role: m.role as any, content: m.content })),
    temperature: 0.7,
  });

  const assistant = completion.choices[0]?.message?.content ?? "…";
  await prisma.message.create({ data: { chatId: chat.id, role: "assistant", content: assistant, index: idx + 1 } });
  // Generate a better title from the first user message
  const firstUserMessage = messages.find(m => m.role === "user");
  const title = firstUserMessage?.content?.slice(0, 50) || "New chat";
  await prisma.chat.update({ where: { id: chat.id }, data: { updatedAt: new Date(), title } });

  return NextResponse.json({ ok: true, content: assistant });
}
