import { db } from "@/db";
import { orders, orderItems, items, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

interface MockPaymentPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export const metadata: Metadata = {
  title: "درگاه پرداخت آزمایشی | JAT",
};

async function getOrder(orderId: string) {
  return db.query.orders.findFirst({ where: eq(orders.id, orderId) }) ?? null;
}

async function getShopSlugForOrder(orderId: string) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) return null;
  const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, order.sellerId) });
  return profile ? profile.shopSlug || profile.username : null;
}

async function handlePaymentSuccess(formData: FormData) {
  "use server";

  const orderId = formData.get("orderId") as string | null;
  if (!orderId) redirect("/");

  const result = await db.transaction(async (tx) => {
    const existingOrder = await tx.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: { orderItems: true },
    });

    if (!existingOrder) throw new Error("سفارش یافت نشد");

    const profile = await tx.query.profiles.findFirst({
      where: eq(profiles.id, existingOrder.sellerId),
    });

    if (!profile) throw new Error("فروشگاه مربوط به این سفارش یافت نشد");

    const slug = profile.shopSlug || profile.username || "";

    // Stock was ALREADY reserved at order creation. No stock changes here.
    // Just update order status to paid.
    await tx
      .update(orders)
      .set({
        status: "paid",
        paymentStatus: "completed",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    return { shopSlug: slug, orderNumber: existingOrder.orderNumber };
  });

  if (!result.shopSlug) {
    const params = result.orderNumber
      ? `?order=${encodeURIComponent(result.orderNumber)}`
      : "";
    redirect(`/checkout/success${params}`);
  }

  revalidatePath(`/shop/${result.shopSlug}`);

  const successUrl = result.orderNumber
    ? `/shop/${result.shopSlug}/success?order=${encodeURIComponent(result.orderNumber)}`
    : `/shop/${result.shopSlug}/success`;
  redirect(successUrl);
}

async function handlePaymentFailed(formData: FormData) {
  "use server";

  const orderId = formData.get("orderId") as string | null;
  if (!orderId) redirect("/");

  const shopSlug = await getShopSlugForOrder(orderId);
  if (!shopSlug) redirect("/");

  // STOCK RESTORATION: return reserved stock on payment failure
  await db.transaction(async (tx) => {
    const existingOrder = await tx.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: { orderItems: true },
    });

    if (existingOrder) {
      for (const orderItem of existingOrder.orderItems) {
        if (orderItem.itemType === "product") {
          const product = await tx.query.items.findFirst({
            where: eq(items.id, orderItem.itemId),
          });
          if (!product) continue;

          const restoredStock = (product.stockQuantity || 0) + (orderItem.quantity || 0);
          await tx
            .update(items)
            .set({ stockQuantity: restoredStock, updatedAt: new Date() })
            .where(eq(items.id, orderItem.itemId));
        }
      }
    }

    await tx
      .update(orders)
      .set({
        status: "cancelled",
        paymentStatus: "failed",
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
  });

  revalidatePath(`/shop/${shopSlug}`);
  redirect(`/shop/${shopSlug}?payment=failed`);
}

export default async function MockPaymentPage({ params }: MockPaymentPageProps) {
  const { orderId } = await params;
  const order = await getOrder(orderId);

  if (!order) notFound();

  const amount = parseFloat(order.totalAmount);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      dir="rtl"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-[-30%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/4 blur-[100px]" />
      </div>

      <div
        className="relative z-10 w-full max-w-md rounded-2xl p-6"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-lg)",
          color: "var(--text-primary)",
        }}
      >
        {/* Bank Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>درگاه پرداخت آزمایشی</p>
            <h1 className="text-lg font-bold mt-1">بانک JAT</h1>
          </div>
          <div className="text-left">
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>شماره سفارش</p>
            <p className="text-sm font-mono" style={{ color: "var(--accent-text)" }}>{order.orderNumber}</p>
          </div>
        </div>

        {/* Amount */}
        <div
          className="mb-6 rounded-xl p-4"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>مبلغ قابل پرداخت</p>
          <p className="text-2xl font-bold">
            {new Intl.NumberFormat("fa-IR").format(amount)}{" "}
            <span className="text-sm font-normal" style={{ color: "var(--text-secondary)" }}>تومان</span>
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <form action={handlePaymentSuccess}>
            <input type="hidden" name="orderId" value={order.id} />
            <button
              type="submit"
              className="w-full min-h-[44px] py-3 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: "linear-gradient(135deg, #34D399 0%, #10B981 100%)",
                boxShadow: "0 0 20px rgba(52, 211, 153, 0.2)",
              }}
            >
              پرداخت موفق
            </button>
          </form>

          <form action={handlePaymentFailed}>
            <input type="hidden" name="orderId" value={order.id} />
            <button
              type="submit"
              className="w-full min-h-[44px] py-3 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: "linear-gradient(135deg, #F87171 0%, #EF4444 100%)",
                boxShadow: "0 0 20px rgba(248, 113, 113, 0.2)",
              }}
            >
              پرداخت ناموفق
            </button>
          </form>
        </div>

        <p className="mt-6 text-[11px] text-center" style={{ color: "var(--text-tertiary)" }}>
          این صفحه فقط برای تست فرایند پرداخت است و هیچ تراکنش واقعی انجام نمی‌شود.
        </p>
      </div>
    </div>
  );
}
