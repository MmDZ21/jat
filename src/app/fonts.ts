import localFont from "next/font/local";

// IRANYekan Web Font Family - Persian-friendly
export const iranYekan = localFont({
  src: [
    {
      path: "./fonts/IRANYekanWebThin.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "./fonts/IRANYekanWebLight.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/IRANYekanWebRegular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/IRANYekanWebMedium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/IRANYekanWebBold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/IRANYekanWebExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "./fonts/IRANYekanWebBlack.woff2",
      weight: "900",
      style: "normal",
    },
    {
      path: "./fonts/IRANYekanWebExtraBlack.woff2",
      weight: "950",
      style: "normal",
    },
  ],
  variable: "--font-iran-yekan",
  display: "swap",
  fallback: ["system-ui", "arial"],
});
