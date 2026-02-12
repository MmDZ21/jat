import type { Metadata } from "next";
import { iranYekan } from "./fonts";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "JAT — فروشگاه‌ساز حرفه‌ای",
  description: "پلتفرم فروشگاه آنلاین برای فروشندگان و خدمات‌دهندگان",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className="dark">
      <body className={`${iranYekan.variable} antialiased`}>
        {children}
        <Toaster
          position="top-center"
          richColors
          closeButton
          dir="rtl"
          theme="dark"
          toastOptions={{
            style: {
              fontFamily: "var(--font-iran-yekan)",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
            },
          }}
        />
      </body>
    </html>
  );
}
