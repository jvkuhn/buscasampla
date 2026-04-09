import { db } from "@/lib/db";
import { AfiliadosManager } from "@/components/admin/AfiliadosManager";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Afiliados — Admin" };

export default async function AfiliadosPage() {
  const rankings = await db.ranking.findMany({
    where: {
      status: "DRAFT",
      items: {
        some: {
          product: {
            affiliateLinks: {
              some: {
                platform: "mercadolivre",
                url: { contains: "lista.mercadolivre.com.br" },
              },
            },
          },
        },
      },
    },
    include: {
      items: {
        include: {
          product: {
            include: { affiliateLinks: true },
          },
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Afiliados</h1>
        <p className="text-sm text-gray-500 mt-1">
          Rankings DRAFT gerados automaticamente. Preencha os links afiliados e imagens, depois publique em{" "}
          <a href="/admin/rankings" className="text-blue-600 hover:underline">
            Rankings
          </a>
          .
        </p>
      </div>
      <AfiliadosManager rankings={rankings} />
    </div>
  );
}
