// owner: m
import type { Metadata } from "next";
import { UnsealedApp } from "@/components/UnsealedApp";

// Set here rather than in the layout, so other pages don't name this one as
// their canonical address.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return <UnsealedApp />;
}
