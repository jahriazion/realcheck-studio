import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!stripe) return NextResponse.json({ ok: false, error: "stripe_disabled" }, { status: 400 });

  let user = await prisma.user.findUnique({ where: { id: (session as any).user.id } });
  if (!user) return NextResponse.json({ ok: false, error: "no_user" }, { status: 400 });

  if (!user.stripeCustomerId) {
    const customer = await stripe.customers.create({ email: user.email ?? undefined });
    user = await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer.id } });
  }

  const price = process.env.STRIPE_PRICE_ID;
  if (!price) return NextResponse.json({ ok: false, error: "missing_price" }, { status: 400 });

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: user.stripeCustomerId!,
    line_items: [{ price, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?status=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?status=cancel`,
  });

  return NextResponse.json({ ok: true, url: checkout.url });
}
