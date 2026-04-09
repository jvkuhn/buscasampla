"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { createTop10RankingData } from "@/lib/top10-core";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import type { Top10Input } from "@/lib/validations";

export async function createTop10Ranking(input: Top10Input) {
  await requireAdmin();
  const created = await createTop10RankingData(input);
  revalidatePath("/admin/rankings");
  redirect(`/admin/rankings/${created.id}`);
}

/**
 * Importa Top 10 com resolução automática de categoria por nome.
 * Se a categoria não existir, cria automaticamente como PUBLISHED.
 * Não redireciona — pensado para importação em lote.
 */
export async function importTop10WithCategory(
  input: Top10Input,
  categoryName?: string
) {
  await requireAdmin();

  if (categoryName) {
    const slug = slugify(categoryName);
    let category = await db.category.findUnique({ where: { slug } });
    if (!category) {
      category = await db.category.create({
        data: { name: categoryName.trim(), slug, status: "PUBLISHED" },
      });
    }
    input.ranking.categoryId = category.id;
  }

  const created = await createTop10RankingData(input);
  revalidatePath("/admin/rankings");
  revalidatePath("/admin/categorias");
  return { id: created.id, title: created.title };
}
