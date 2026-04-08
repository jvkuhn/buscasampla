"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { productSchema, affiliateLinkSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
}

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
