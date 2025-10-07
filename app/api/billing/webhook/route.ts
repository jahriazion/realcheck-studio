import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs"; // ensure raw body

export async function POST(req: Request) {
  if (!stripe) return NextResponse.json({ ok: false }, { status: 200 }); // noop

  const sig = req.headers.get("stripe-signature") || "";
  const whsec = process.env.STRIPE_WEBHOOK_SECRET || "";
  const raw = await req.text();
  try {
    const event = stripe.webhooks.constructEvent(raw, sig, whsec);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const customerId = session.customer as string;
      if (customerId) {
        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { subscriptionStatus: "active" },
        });
      }
    } else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as any;
      const customerId = sub.customer as string;
      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { subscriptionStatus: "canceled" },
      });
    }
  } catch (e) {
    console.error("stripe webhook error", e);
    return new NextResponse("Bad signature", { status: 400 });
  }
  return new NextResponse("ok");
}
