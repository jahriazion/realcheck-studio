import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { name, firstName, lastName } = await req.json();
    
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: name || null,
        firstName: firstName || null,
        lastName: lastName || null,
      },
    });

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ ok: false, error: "Failed to update profile" }, { status: 500 });
  }
}
