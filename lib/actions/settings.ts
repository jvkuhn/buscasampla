"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { bannerSchema, manualLinkSchema, sitePageSchema, siteSettingsSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

// ─── Banners ─────────────────────────────────────────────────────────────────

export async function createBanner(formData: FormData) {
  await requireAdmin();

  const raw = Object.fromEntries(formData);
  const parsed = bannerSchema.safeParse({
    ...raw,
    active: raw.active === "true" || raw.active === "on",
    order: raw.order ?? 0,
  });
  if (!parsed.success) throw new Error("Dados inválidos: " + JSON.stringify(parsed.error.flatten().fieldErrors));

  await db.banner.create({ data: parsed.data });
  revalidatePath("/admin/banners");
  revalidatePath("/");
  redirect("/admin/banners");
}

export async function updateBanner(id: string, formData: FormData) {
  await requireAdmin();

  const raw = Object.fromEntries(formData);
  const parsed = bannerSchema.safeParse({
    ...raw,
    active: raw.active === "true" || raw.active === "on",
    order: raw.order ?? 0,
  });
  if (!parsed.success) throw new Error("Dados inválidos: " + JSON.stringify(parsed.error.flatten().fieldErrors));

  await db.banner.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/banners");
  revalidatePath("/");
  redirect("/admin/banners");
}

export async function deleteBanner(id: string) {
  await requireAdmin();
  await db.banner.delete({ where: { id } });
  revalidatePath("/admin/banners");
  revalidatePath("/");
}

// ─── Páginas ─────────────────────────────────────────────────────────────────

export async function createSitePage(formData: FormData) {
  await requireAdmin();

  const raw = Object.fromEntries(formData);
  const parsed = sitePageSchema.safeParse({
    ...raw,
    slug: raw.slug || slugify(raw.title as string),
    status: raw.status ?? "DRAFT",
  });
  if (!parsed.success) throw new Error("Dados inválidos: " + JSON.stringify(parsed.error.flatten().fieldErrors));

  await db.sitePage.create({ data: parsed.data });
  revalidatePath("/admin/paginas");
  redirect("/admin/paginas");
}

export async function updateSitePage(id: string, formData: FormData) {
  await requireAdmin();

  const raw = Object.fromEntries(formData);
  const parsed = sitePageSchema.safeParse({
    ...raw,
    status: raw.status ?? "DRAFT",
  });
  if (!parsed.success) throw new Error("Dados inválidos: " + JSON.stringify(parsed.error.flatten().fieldErrors));

  await db.sitePage.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/paginas");
  revalidatePath(`/p/${parsed.data.slug}`);
  redirect("/admin/paginas");
}

export async function deleteSitePage(id: string) {
  await requireAdmin();
  await db.sitePage.delete({ where: { id } });
  revalidatePath("/admin/paginas");
}

// ─── Configurações ────────────────────────────────────────────────────────────

export async function updateSiteSettings(formData: FormData) {
  await requireAdmin();

  const raw = Object.fromEntries(formData);
  const parsed = siteSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Dados inválidos: " + JSON.stringify(parsed.error.flatten().fieldErrors));
  }

  await db.siteSettings.upsert({
    where: { id: "default" },
    update: parsed.data,
    create: { id: "default", ...parsed.data },
  });

  revalidatePath("/admin/configuracoes");
  revalidatePath("/");
  redirect("/admin/configuracoes");
}

// ─── Links Manuais ────────────────────────────────────────────────────────────

export async function updateManualLinks(formData: FormData) {
  await requireAdmin();

  const links: { label: string; url: string }[] = [];
  for (let i = 0; i < 20; i++) {
    const label = (formData.get(`label_${i}`) as string)?.trim();
    const url = (formData.get(`url_${i}`) as string)?.trim();
    if (label && url) {
      const parsed = manualLinkSchema.safeParse({ label, url });
      if (parsed.success) links.push(parsed.data);
    }
  }

  await db.siteSettings.upsert({
    where: { id: "default" },
    update: { manualLinks: links },
    create: { id: "default", manualLinks: links },
  });

  revalidatePath("/admin/linksmanuais");
  revalidatePath("/linksdireto");
  redirect("/admin/linksmanuais");
}
