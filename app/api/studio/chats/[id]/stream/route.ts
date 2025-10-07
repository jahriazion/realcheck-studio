import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { openai, isOpenAIConfigured } from "@/lib/ai";
import { modelMap } from "@/lib/models";

export async function POST(req: Request, { params }: { params: { id: string }}) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  // Check if OpenAI is configured
  if (!isOpenAIConfigured()) {
    return NextResponse.json({ ok: false, error: "AI service not configured. Please add OPENAI_API_KEY to environment variables." }, { status: 500 });
  }

  const { content, model = "rc-mini" } = await req.json();
  if (!content || typeof content !== "string") return NextResponse.json({ ok: false, error: "missing content" }, { status: 400 });
  const chat = await prisma.chat.findUnique({ where: { id: params.id } });
  if (!chat || chat.userId !== (session as any).user.id) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  const idx = await prisma.message.count({ where: { chatId: chat.id } });
  await prisma.message.create({ data: { chatId: chat.id, role: "user", content, index: idx } });
  const messages = await prisma.message.findMany({ where: { chatId: chat.id }, orderBy: { index: "asc" } });

  const mapped = modelMap[(model as any)] ?? modelMap["rc-mini"];

  const stream = await openai.chat.completions.create({
    model: mapped.model,
    messages: messages.map(m => ({ role: m.role as any, content: m.content })),
    temperature: 0.7,
    stream: true,
  });

  const encoder = new TextEncoder();
  let full = "";

  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const part of stream) {
          const delta = part.choices?.[0]?.delta?.content ?? "";
          if (delta) {
            full += delta;
            controller.enqueue(encoder.encode(delta));
          }
        }
        controller.close();
        // persist the assistant message
        await prisma.message.create({ data: { chatId: chat.id, role: "assistant", content: full, index: idx + 1 } });
        // Generate a better title from the first user message
        const firstUserMessage = messages.find(m => m.role === "user");
        const title = firstUserMessage?.content?.slice(0, 50) || "New chat";
        await prisma.chat.update({ where: { id: chat.id }, data: { updatedAt: new Date(), title } });
      } catch (e) {
        console.error("Streaming error:", e);
        // Send error message to user
        const errorMessage = "Sorry, I encountered an error while processing your request. Please try again.";
        controller.enqueue(encoder.encode(errorMessage));
        controller.close();
        
        // Save error message to database
        try {
          await prisma.message.create({ data: { chatId: chat.id, role: "assistant", content: errorMessage, index: idx + 1 } });
        } catch (dbError) {
          console.error("Database error:", dbError);
        }
      }
    }
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" }
  });
}
