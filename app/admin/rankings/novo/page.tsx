import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { RankingForm } from "@/components/admin/RankingForm";
import { createRanking } from "@/lib/actions/rankings";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo Ranking — Admin" };

export default async function NewRankingPage() {
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <PageHeader title="Novo Ranking" />
      <RankingForm action={createRanking} categories={categories} />
    </div>
  );
}
