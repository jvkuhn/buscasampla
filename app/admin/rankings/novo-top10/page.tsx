import { db } from "@/lib/db";
import { Top10Form } from "@/components/admin/Top10Form";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Importar Top 10 — Admin" };

export default async function NewTop10Page() {
  const categories = await db.category.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Importar Top 10</h1>
        <p className="text-sm text-gray-500 mt-1">
          Selecione os arquivos JSON gerados e importe todos de uma vez como rascunho.
        </p>
      </div>
      <Top10Form categories={categories} />
    </div>
  );
}
