// owner: m
import type { Metadata } from "next";
import {
  Atkinson_Hyperlegible_Next,
  Besley,
  Courier_Prime,
} from "next/font/google";
import "./globals.css";

// Body text: a typeface designed for legibility under stress.
const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin"],
});

// Headings and key figures.
const besley = Besley({
  variable: "--font-besley",
  subsets: ["latin"],
});

// The letter's own words, so quotes never look like Unsealed's words.
const courierPrime = Courier_Prime({
  variable: "--font-courier-prime",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Unsealed — make sense of an official letter",
  description:
    "Upload a bill, notice or demand. Unsealed explains what it means, what you owe, when it's due and what to do next, with the words from the letter that say so.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${atkinson.variable} ${besley.variable} ${courierPrime.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
