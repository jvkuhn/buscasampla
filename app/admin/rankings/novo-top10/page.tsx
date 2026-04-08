import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { Top10Form } from "@/components/admin/Top10Form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo Top 10 — Admin" };

export default async function NewTop10Page() {
  const categories = await db.category.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <PageHeader
        title="Criar Top 10"
        description="Cadastre o ranking inteiro (10 produtos + links de afiliado) em uma única tela."
      />
      <Top10Form categories={categories} />
    </div>
  );
}
