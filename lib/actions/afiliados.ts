"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
}

export type AfiliadoItem = {
  productId: string;
  mercadoLivreUrl?: string;
  imageUrl?: string;
};

export type ProductConfigItem = {
  productId: string;
  mercadoLivreUrl?: string;
  imageUrl?: string;
  categoryId?: string;
  amazonUrl?: string;
  shopeeUrl?: string;
};

export async function updateRankingAfiliados(items: AfiliadoItem[]) {
  await requireAdmin();

  for (const { productId, mercadoLivreUrl, imageUrl } of items) {
    if (mercadoLivreUrl) {
      const existing = await db.affiliateLink.findFirst({
        where: { productId, platform: "mercadolivre" },
      });
      if (existing) {
        await db.affiliateLink.update({
          where: { id: existing.id },
          data: { url: mercadoLivreUrl },
        });
      } else {
        await db.affiliateLink.create({
          data: {
            platform: "mercadolivre",
            url: mercadoLivreUrl,
            label: "Ver no Mercado Livre",
            productId,
          },
        });
      }
    }
    if (imageUrl) {
      await db.product.update({
        where: { id: productId },
        data: { imageUrl },
      });
    }
  }

  revalidatePath("/admin/listaconfigurar");
  revalidatePath("/admin/rankings");
}

export async function updateProductConfig(items: ProductConfigItem[]) {
  await requireAdmin();

  for (const { productId, mercadoLivreUrl, imageUrl, categoryId, amazonUrl, shopeeUrl } of items) {
    // Update mercadolivre link
    if (mercadoLivreUrl) {
      const existing = await db.affiliateLink.findFirst({
        where: { productId, platform: "mercadolivre" },
      });
      if (existing) {
        await db.affiliateLink.update({
          where: { id: existing.id },
          data: { url: mercadoLivreUrl },
        });
      } else {
        await db.affiliateLink.create({
          data: {
            platform: "mercadolivre",
            url: mercadoLivreUrl,
            label: "Ver no Mercado Livre",
            productId,
          },
        });
      }
    }

    // Update amazon link
    if (amazonUrl) {
      const existing = await db.affiliateLink.findFirst({
        where: { productId, platform: "amazon" },
      });
      if (existing) {
        await db.affiliateLink.update({
          where: { id: existing.id },
          data: { url: amazonUrl },
        });
      } else {
        await db.affiliateLink.create({
          data: {
            platform: "amazon",
            url: amazonUrl,
            label: "Ver na Amazon",
            productId,
          },
        });
      }
    }

    // Update shopee link
    if (shopeeUrl) {
      const existing = await db.affiliateLink.findFirst({
        where: { productId, platform: "shopee" },
      });
      if (existing) {
        await db.affiliateLink.update({
          where: { id: existing.id },
          data: { url: shopeeUrl },
        });
      } else {
        await db.affiliateLink.create({
          data: {
            platform: "shopee",
            url: shopeeUrl,
            label: "Ver na Shopee",
            productId,
          },
        });
      }
    }

    // Update product fields
    const productUpdate: { imageUrl?: string; categoryId?: string } = {};
    if (imageUrl) productUpdate.imageUrl = imageUrl;
    if (categoryId) productUpdate.categoryId = categoryId;

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
