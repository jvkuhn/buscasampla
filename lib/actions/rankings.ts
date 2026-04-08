"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rankingSchema, faqSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
}

export async function createRanking(formData: FormData) {
  await requireAdmin();

  const raw = Object.fromEntries(formData);
  const parsed = rankingSchema.safeParse({
    ...raw,
    status: raw.status ?? "DRAFT",
    categoryId: raw.categoryId || null,
  });
  if (!parsed.success) throw new Error("Dados inválidos: " + JSON.stringify(parsed.error.flatten().fieldErrors));

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
  if (!parsed.success) throw new Error("Dados inválidos: " + JSON.stringify(parsed.error.flatten().fieldErrors));

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

export async function reorderRankingItems(
  rankingId: string,
  items: Array<{ id: string; order: number }>
) {
  await requireAdmin();
  await Promise.all(
    items.map((item) =>
      db.rankingItem.update({ where: { id: item.id }, data: { order: item.order } })
    )
  );
  revalidatePath(`/admin/rankings/${rankingId}`);
}

export async function createFAQ(rankingId: string, formData: FormData) {
  await requireAdmin();

  const raw = Object.fromEntries(formData);
  const parsed = faqSchema.safeParse({ ...raw, rankingId });
  if (!parsed.success) throw new Error("Dados inválidos: " + JSON.stringify(parsed.error.flatten().fieldErrors));

  await db.fAQ.create({ data: parsed.data });
  revalidatePath(`/admin/rankings/${rankingId}`);
}

export async function deleteFAQ(id: string, rankingId: string) {
  await requireAdmin();
  await db.fAQ.delete({ where: { id } });
  revalidatePath(`/admin/rankings/${rankingId}`);
}
