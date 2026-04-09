import { db } from "@/lib/db";
import { ConfigurarProdutosManager } from "@/components/admin/ConfigurarProdutosManager";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Configurar Produtos — Admin" };

export default async function ListaConfigurarPage() {
  const products = await db.product.findMany({
    where: {
      OR: [
        { imageUrl: null },
        { imageUrl: "" },
        { categoryId: null },
        {
          affiliateLinks: {
            some: {
              platform: "mercadolivre",
              url: { contains: "lista.mercadolivre.com.br" },
            },
          },
        },
      ],
    },
    include: {
      affiliateLinks: true,
      category: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const categories = await db.category.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurar Produtos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Produtos com configuracao pendente. Preencha os campos obrigatorios para completar o cadastro.
        </p>
      </div>
      <ConfigurarProdutosManager products={products} categories={categories} />
    </div>
  );
}
