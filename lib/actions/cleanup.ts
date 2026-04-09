"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";

/**
 * Apaga todos os rankings, produtos, FAQs e links de afiliado.
 * Mantém: categorias, banners, páginas, configurações, usuários.
 */
export async function cleanupRankingsAndProducts() {
  await requireAdmin();

  const [rankingItems, faqs, affiliateLinks, rankings, products] =
    await db.$transaction([
      db.rankingItem.deleteMany(),
      db.fAQ.deleteMany(),
      db.affiliateLink.deleteMany(),
      db.ranking.deleteMany(),
      db.product.deleteMany(),
    ]);

  revalidatePath("/admin");
  revalidatePath("/admin/rankings");
  revalidatePath("/admin/produtos");
  revalidatePath("/");

  return {
    rankingItems: rankingItems.count,
    faqs: faqs.count,
    affiliateLinks: affiliateLinks.count,
    rankings: rankings.count,
    products: products.count,
  };
}
