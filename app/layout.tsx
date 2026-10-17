// owner: m
import type { Metadata } from "next";
import {
  Atkinson_Hyperlegible_Next,
  Besley,
  Courier_Prime,
} from "next/font/google";
import { SiteFooter } from "@/components/layout/SiteFooter";
import "./globals.css";

// Body text: a typeface designed for legibility under stress.
const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin"],
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

// Headings and key figures. The italic is for emphasis within a heading.
const besley = Besley({
  variable: "--font-besley",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

// The letter's own words, so quotes never look like Unsealed's words.
const courierPrime = Courier_Prime({
  variable: "--font-courier-prime",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://unsealed-one.vercel.app"),
  title: "Unsealed — make sense of an official letter",
  description:
    "Upload a bill, notice or demand. Unsealed explains what it means, what you owe, when it's due and what to do next, and shows the words in the letter behind each answer it can confirm.",
  // No title or description here: Next.js fills them in from each page's own,
  // and the Twitter card from these.
  openGraph: {
    type: "website",
    siteName: "Unsealed",
    images: [
      {
        url: "/apple-icon.png",
        width: 180,
        height: 180,
        alt: "The Unsealed logo, a letter rising from an open envelope",
      },
    ],
  },
  twitter: { card: "summary" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${atkinson.variable} ${besley.variable} ${courierPrime.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
