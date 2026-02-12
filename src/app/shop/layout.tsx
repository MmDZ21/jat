export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Dedicated layout for public shop pages.
  // Keeps shop UI isolated from the rest of the app.
  return <>{children}</>;
}

