import ShopSuccessClient from "@/components/ShopSuccessClient";

interface CheckoutSuccessPageProps {
  searchParams: Promise<{
    order?: string;
  }>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const { order: orderNumber } = await searchParams;

  return (
    <ShopSuccessClient
      orderNumber={orderNumber ?? undefined}
    />
  );
}
