import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  title: {
    template: "%s | Top Rankings",
    default: "Top Rankings — Melhores produtos em listas Top 10",
  },
  description:
    "Comparativos e rankings dos melhores produtos em todas as categorias. Encontre o produto ideal com avaliações detalhadas e links de compra.",
  metadataBase: new URL(siteUrl),
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen bg-white font-sans antialiased">{children}</body>
    </html>
  );
}
