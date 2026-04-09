"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { createTop10RankingData } from "@/lib/top10-core";
import type { Top10Input } from "@/lib/validations";

export async function createTop10Ranking(input: Top10Input) {
  await requireAdmin();
  const created = await createTop10RankingData(input);
  revalidatePath("/admin/rankings");
  redirect(`/admin/rankings/${created.id}`);
}
