import type { Metadata } from "next";

export { default } from "@/components/public/HomePageContent";

// Mesma razao da home: cache curto no lugar de render por requisicao.
export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};
