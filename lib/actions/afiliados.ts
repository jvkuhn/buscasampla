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

  revalidatePath("/admin/afiliados");
  revalidatePath("/admin/rankings");
}
