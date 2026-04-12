"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { rankingSchema, faqSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

export async function createRanking(formData: FormData) {
  await requireAdmin();

  const raw = Object.fromEntries(formData);
  const parsed = rankingSchema.safeParse({
    ...raw,
    status: raw.status ?? "DRAFT",
    categoryId: raw.categoryId || null,
  });
  if (!parsed.success) {
    console.error("[rankings] validation error:", parsed.error.flatten().fieldErrors);
    throw new Error("Dados inválidos. Verifique os campos e tente novamente.");
  }

  const slug = parsed.data.slug || slugify(parsed.data.title);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.ranking.create({ data: { ...parsed.data, slug } as any });

  revalidatePath("/admin/rankings");
  redirect("/admin/rankings");
}

export async function updateRanking(id: string, formData: FormData) {
  await requireAdmin();

  const raw = Object.fromEntries(formData);
  const parsed = rankingSchema.safeParse({
    ...raw,
    status: raw.status ?? "DRAFT",
    categoryId: raw.categoryId || null,
  });
  if (!parsed.success) {
    console.error("[rankings] validation error:", parsed.error.flatten().fieldErrors);
    throw new Error("Dados inválidos. Verifique os campos e tente novamente.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.ranking.update({ where: { id }, data: parsed.data as any });

  revalidatePath("/admin/rankings");
  revalidatePath(`/ranking/${parsed.data.slug}`);
  redirect("/admin/rankings");
}

export async function deleteRanking(id: string) {
  await requireAdmin();
  await db.ranking.delete({ where: { id } });
  revalidatePath("/admin/rankings");
}

export async function addRankingItem(rankingId: string, productId: string) {
  await requireAdmin();

  const count = await db.rankingItem.count({ where: { rankingId } });

  await db.rankingItem.create({
    data: { rankingId, productId, order: count + 1 },
  });

  revalidatePath(`/admin/rankings/${rankingId}`);
}

export async function removeRankingItem(rankingItemId: string, rankingId: string) {
  await requireAdmin();
  await db.rankingItem.delete({ where: { id: rankingItemId } });
  // Reorder remaining items
  const items = await db.rankingItem.findMany({
    where: { rankingId },
    orderBy: { order: "asc" },
  });
  await Promise.all(
    items.map((item, idx) =>
      db.rankingItem.update({ where: { id: item.id }, data: { order: idx + 1 } })
    )
  );
  revalidatePath(`/admin/rankings/${rankingId}`);
}

export async function reorderRankingItems(rankingId: string, orderedIds: string[]) {
  await requireAdmin();

  await db.$transaction(async (tx) => {
    // First pass: set all to negative temporary values to avoid unique conflicts
    await Promise.all(
      orderedIds.map((id, idx) =>
        tx.rankingItem.update({
          where: { id },
          data: { order: -(idx + 1) },
        })
      )
    );
    // Second pass: set final positive values
    await Promise.all(
      orderedIds.map((id, idx) =>
        tx.rankingItem.update({
          where: { id },
          data: { order: idx + 1 },
        })
      )
    );
  });

  revalidatePath(`/admin/rankings/${rankingId}`);
}

export async function createFAQ(rankingId: string, formData: FormData) {
  await requireAdmin();

  const raw = Object.fromEntries(formData);
  const parsed = faqSchema.safeParse({ ...raw, rankingId });
  if (!parsed.success) {
    console.error("[rankings] validation error:", parsed.error.flatten().fieldErrors);
    throw new Error("Dados inválidos. Verifique os campos e tente novamente.");
  }

  await db.fAQ.create({ data: parsed.data });
  revalidatePath(`/admin/rankings/${rankingId}`);
}

export async function deleteFAQ(id: string, rankingId: string) {
  await requireAdmin();
  await db.fAQ.delete({ where: { id } });
  revalidatePath(`/admin/rankings/${rankingId}`);
}
