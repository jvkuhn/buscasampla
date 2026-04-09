"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { productSchema, affiliateLinkSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

function parseArrayField(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const raw = Object.fromEntries(formData);
  const parsed = productSchema.safeParse({
    ...raw,
    pros: parseArrayField(raw.pros as string),
    cons: parseArrayField(raw.cons as string),
    gallery: parseArrayField(raw.gallery as string),
    status: raw.status ?? "DRAFT",
    categoryId: raw.categoryId || null,
    badge: raw.badge || null,
    currentPrice: raw.currentPrice || null,
    oldPrice: raw.oldPrice || null,
    rating: raw.rating || null,
  });
  if (!parsed.success) throw new Error("Dados inválidos: " + JSON.stringify(parsed.error.flatten().fieldErrors));

  const slug = parsed.data.slug || slugify(parsed.data.name);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.product.create({ data: { ...parsed.data, slug } as any });

  revalidatePath("/admin/produtos");
  redirect("/admin/produtos");
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin();

  const raw = Object.fromEntries(formData);
  const parsed = productSchema.safeParse({
    ...raw,
    pros: parseArrayField(raw.pros as string),
    cons: parseArrayField(raw.cons as string),
    gallery: parseArrayField(raw.gallery as string),
    status: raw.status ?? "DRAFT",
    categoryId: raw.categoryId || null,
    badge: raw.badge || null,
    currentPrice: raw.currentPrice || null,
    oldPrice: raw.oldPrice || null,
    rating: raw.rating || null,
  });
  if (!parsed.success) throw new Error("Dados inválidos: " + JSON.stringify(parsed.error.flatten().fieldErrors));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.product.update({ where: { id }, data: parsed.data as any });

  revalidatePath("/admin/produtos");
  revalidatePath(`/produto/${parsed.data.slug}`);
  redirect("/admin/produtos");
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await db.product.delete({ where: { id } });
  revalidatePath("/admin/produtos");
}

export async function upsertAffiliateLink(
  productId: string,
  data: { platform: string; url: string; label?: string; id?: string }
) {
  await requireAdmin();

  const parsed = affiliateLinkSchema.safeParse(data);
  if (!parsed.success) throw new Error("Dados inválidos: " + JSON.stringify(parsed.error.flatten().fieldErrors));

  if (data.id) {
    await db.affiliateLink.update({
      where: { id: data.id },
      data: { ...parsed.data, productId },
    });
  } else {
    await db.affiliateLink.create({ data: { ...parsed.data, productId } });
  }

  revalidatePath(`/admin/produtos/${productId}`);
}

export async function deleteAffiliateLink(id: string, productId: string) {
  await requireAdmin();
  await db.affiliateLink.delete({ where: { id } });
  revalidatePath(`/admin/produtos/${productId}`);
}

const PLATFORM_LABELS: Record<string, string> = {
  amazon: "Ver na Amazon",
  mercadolivre: "Ver no Mercado Livre",
  shopee: "Ver na Shopee",
};

/**
 * Atualiza imagem e links de afiliado de um produto rapidamente,
 * sem precisar acessar a página completa de edição do produto.
 * Chamado direto da página de edição do ranking.
 */
export async function quickUpdateProductMedia(
  productId: string,
  rankingId: string,
  data: { imageUrl: string; amazon: string; mercadolivre: string; shopee: string }
) {
  await requireAdmin();

  await db.product.update({
    where: { id: productId },
    data: { imageUrl: data.imageUrl || null },
  });

  for (const platform of ["amazon", "mercadolivre", "shopee"] as const) {
    const url = data[platform].trim();
    const existing = await db.affiliateLink.findFirst({ where: { productId, platform } });

    if (url) {
      if (existing) {
        await db.affiliateLink.update({ where: { id: existing.id }, data: { url } });
      } else {
        await db.affiliateLink.create({
          data: { productId, platform, url, label: PLATFORM_LABELS[platform] },
        });
      }
    } else if (existing) {
      await db.affiliateLink.delete({ where: { id: existing.id } });
    }
  }

  revalidatePath(`/admin/rankings/${rankingId}`);
  revalidatePath(`/admin/produtos/${productId}`);
}
