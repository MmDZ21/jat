import ShopSuccessClient from "@/components/ShopSuccessClient";

interface CheckoutSuccessPageProps {
  searchParams: Promise<{
    order?: string;
    phone?: string;
  }>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const { order: orderNumber, phone } = await searchParams;

  return (
    <ShopSuccessClient
      orderNumber={orderNumber ?? undefined}
      customerPhone={phone ?? undefined}
    />
  );
}
