"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createTop10RankingData } from "@/lib/top10-core";
import type { Top10Input } from "@/lib/validations";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
}

export async function createTop10Ranking(input: Top10Input) {
  await requireAdmin();
  const created = await createTop10RankingData(input);
  revalidatePath("/admin/rankings");
  redirect(`/admin/rankings/${created.id}`);
}
