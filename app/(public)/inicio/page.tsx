import type { Metadata } from "next";

export { default } from "@/components/public/HomePageContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};
