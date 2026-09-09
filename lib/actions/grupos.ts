"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { whatsappGroupSchema } from "@/lib/validations";

// A pagina publica /<slug> e cacheada (ISR) pra nao consultar o Neon a cada
// clique de anuncio. Sem revalidar aqui, trocar o link do grupo lotado so
// surtiria efeito na proxima revalidacao — com trafego pago rodando, isso
// significa mandar gente pra um grupo cheio por ate uma hora.
function revalidarGrupo(slug: string) {
  revalidatePath("/admin/grupos");
  revalidatePath(`/${slug}`);
}

// Checkbox ausente no FormData significa desmarcado; z.coerce.boolean() veria
// a string "false" como true, entao a normalizacao acontece antes do parse.
function parseGrupo(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = whatsappGroupSchema.safeParse({
    ...raw,
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });
  if (!parsed.success) {
    console.error("[grupos] validation error:", parsed.error.flatten().fieldErrors);
    const primeiro = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    throw new Error(primeiro ?? "Dados inválidos. Verifique os campos e tente novamente.");
  }
  return parsed.data;
}

export async function createGroup(formData: FormData) {
  await requireAdmin();
  const data = parseGrupo(formData);

  const existente = await db.whatsAppGroup.findUnique({ where: { slug: data.slug } });
  if (existente) {
    throw new Error(`Já existe um grupo com o slug "${data.slug}".`);
  }

  await db.whatsAppGroup.create({ data });

  revalidarGrupo(data.slug);
  redirect("/admin/grupos");
}

export async function updateGroup(id: string, formData: FormData) {
  await requireAdmin();
  const data = parseGrupo(formData);

  // O slug pode ter mudado; a rota antiga tambem precisa sair do cache, senao
  // continua servindo a pagina de um slug que nao existe mais.
  const anterior = await db.whatsAppGroup.findUnique({ where: { id } });
  await db.whatsAppGroup.update({ where: { id }, data });

  if (anterior && anterior.slug !== data.slug) revalidarGrupo(anterior.slug);
  revalidarGrupo(data.slug);
  redirect("/admin/grupos");
}

export async function deleteGroup(id: string) {
  await requireAdmin();
  const grupo = await db.whatsAppGroup.delete({ where: { id } });
  revalidarGrupo(grupo.slug);
}
