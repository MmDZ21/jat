import type { Metadata } from "next";
import { iranYekan } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "JAT - لینک در بیو",
  description: "پلتفرم لینک در بیو برای فروشندگان و خدمات دهندگان",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${iranYekan.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
