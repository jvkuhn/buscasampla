"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { z } from "zod";

const urlOrEmpty = z.string().url().or(z.literal("")).optional();

const productConfigItemSchema = z.object({
  productId: z.string().min(1),
  mercadoLivreUrl: urlOrEmpty,
  imageUrl: urlOrEmpty,
  categoryId: z.string().optional(),
  currentPrice: z.number().positive().optional(),
  oldPrice: z.number().positive().optional(),
});

const productConfigSchema = z.array(productConfigItemSchema);

export type ProductConfigItem = z.infer<typeof productConfigItemSchema>;

async function upsertAffiliateLink(productId: string, platform: string, url: string, label: string) {
  const existing = await db.affiliateLink.findFirst({
    where: { productId, platform },
  });
  if (existing) {
    await db.affiliateLink.update({
      where: { id: existing.id },
      data: { url },
    });
  } else {
    await db.affiliateLink.create({
      data: { platform, url, label, productId },
    });
  }
}

export async function updateProductConfig(items: ProductConfigItem[]) {
  await requireAdmin();

  const parsed = productConfigSchema.safeParse(items);
  if (!parsed.success) {
    throw new Error("Dados inválidos: " + JSON.stringify(parsed.error.flatten()));
  }
  const validItems = parsed.data;

  for (const { productId, mercadoLivreUrl, imageUrl, categoryId, currentPrice, oldPrice } of validItems) {
    if (mercadoLivreUrl) await upsertAffiliateLink(productId, "mercadolivre", mercadoLivreUrl, "Ver no Mercado Livre");

    const productUpdate: { imageUrl?: string; categoryId?: string; currentPrice?: number; oldPrice?: number } = {};
    if (imageUrl) productUpdate.imageUrl = imageUrl;
    if (categoryId) productUpdate.categoryId = categoryId;
    if (currentPrice) productUpdate.currentPrice = currentPrice;
    if (oldPrice) productUpdate.oldPrice = oldPrice;

    if (Object.keys(productUpdate).length > 0) {
      await db.product.update({
        where: { id: productId },
        data: productUpdate,
      });
    }
  }

  revalidatePath("/admin/listaconfigurar");
  revalidatePath("/admin/rankings");
  revalidatePath("/admin/produtos");
}
