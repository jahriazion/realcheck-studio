import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { email, password, name, firstName, lastName } = await req.json();
  if (!email || !password) return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ ok: false, error: "Email already in use" }, { status: 400 });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ 
    data: { 
      email, 
      passwordHash, 
      name: name || `${firstName || ''} ${lastName || ''}`.trim() || null,
      firstName: firstName || null,
      lastName: lastName || null
    } 
  });
  return NextResponse.json({ ok: true, id: user.id });
}
