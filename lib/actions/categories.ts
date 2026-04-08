"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { categorySchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  return session;
}

export async function createCategory(formData: FormData) {
  await requireAdmin();

  const raw = Object.fromEntries(formData);
  const parsed = categorySchema.safeParse({
    ...raw,
    order: raw.order ?? 0,
    status: raw.status ?? "DRAFT",
  });
  if (!parsed.success) throw new Error("Dados inválidos: " + JSON.stringify(parsed.error.flatten().fieldErrors));

  const slug = parsed.data.slug || slugify(parsed.data.name);

  await db.category.create({
    data: { ...parsed.data, slug },
  });

  revalidatePath("/admin/categorias");
  revalidatePath("/");
  redirect("/admin/categorias");
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdmin();

  const raw = Object.fromEntries(formData);
  const parsed = categorySchema.safeParse({
    ...raw,
    order: raw.order ?? 0,
    status: raw.status ?? "DRAFT",
  });
  if (!parsed.success) throw new Error("Dados inválidos: " + JSON.stringify(parsed.error.flatten().fieldErrors));

  await db.category.update({ where: { id }, data: parsed.data });

  revalidatePath("/admin/categorias");
  revalidatePath("/categorias");
  redirect("/admin/categorias");
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  await db.category.delete({ where: { id } });
  revalidatePath("/admin/categorias");
  revalidatePath("/");
}
