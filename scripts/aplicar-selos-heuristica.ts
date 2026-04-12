/**
 * Aplica selos (Badge) automaticamente em produtos sem badge, usando heurística
 * baseada em posição no ranking e preço.
 *
 * Uso:
 *   npx tsx scripts/aplicar-selos-heuristica.ts              # dry-run (default)
 *   npx tsx scripts/aplicar-selos-heuristica.ts --apply      # grava no banco
 *
 * Heurística (por ranking, atribuída ao primeiro item com badge == null):
 *   1. Posição 1 → MELHOR_ESCOLHA
 *   2. Posição 2 → RECOMENDADO
 *   3. Posição 3 → MAIS_VENDIDO
 *   4. Item com menor currentPrice (dos restantes) → CUSTO_BENEFICIO
 *   5. Item com maior currentPrice (dos restantes) → PREMIUM
 *   6. Todos os restantes sem badge → BOM_E_BARATO
 *
 * NUNCA sobrescreve badge existente. Só toca em products.badge == null.
 * Produtos que aparecem em múltiplos rankings são atualizados apenas uma vez
 * (primeiro ranking processado ganha a atribuição).
 */

import { PrismaClient, Badge } from "@prisma/client";

const db = new PrismaClient();

const APPLY = process.argv.includes("--apply");

type Assignment = { productId: string; productName: string; badge: Badge; reason: string };

async function main() {
  console.log(APPLY ? "MODO: --apply (grava no DB)" : "MODO: dry-run (nenhum write)");
  console.log("");

  const rankings = await db.ranking.findMany({
    where: { status: "PUBLISHED" },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              badge: true,
              currentPrice: true,
            },
          },
        },
      },
    },
  });

  const decisions = new Map<string, Assignment>();

  for (const ranking of rankings) {
    // Itens do ranking cujos produtos ainda estão sem badge E ainda não foram
    // decididos por um ranking anterior nesta execução.
    const candidates = ranking.items.filter(
      (it) => it.product.badge === null && !decisions.has(it.product.id)
    );

    if (candidates.length === 0) continue;

    const assign = (item: (typeof candidates)[number], badge: Badge, reason: string) => {
      decisions.set(item.product.id, {
        productId: item.product.id,
        productName: item.product.name,
        badge,
        reason: `[${ranking.title}] ${reason}`,
      });
    };

    // Regras 1–3: posição
    const pos1 = candidates.find((it) => it.order === 1);
    if (pos1) assign(pos1, "MELHOR_ESCOLHA", "posição 1");

    const pos2 = candidates.find((it) => it.order === 2 && !decisions.has(it.product.id));
    if (pos2) assign(pos2, "RECOMENDADO", "posição 2");

    const pos3 = candidates.find((it) => it.order === 3 && !decisions.has(it.product.id));
    if (pos3) assign(pos3, "MAIS_VENDIDO", "posição 3");

    // Regras 4–5: preço (dos restantes ainda sem decisão)
    const remaining = candidates.filter((it) => !decisions.has(it.product.id));
    const withPrice = remaining.filter((it) => it.product.currentPrice != null);

    if (withPrice.length > 0) {
      // Menor preço
      const cheapest = withPrice.reduce((a, b) =>
        Number(a.product.currentPrice!) <= Number(b.product.currentPrice!) ? a : b
      );
      assign(cheapest, "CUSTO_BENEFICIO", "menor preço");

      const stillRemaining = remaining.filter((it) => !decisions.has(it.product.id));
      const stillWithPrice = stillRemaining.filter((it) => it.product.currentPrice != null);

      if (stillWithPrice.length > 0) {
        const priciest = stillWithPrice.reduce((a, b) =>
          Number(a.product.currentPrice!) >= Number(b.product.currentPrice!) ? a : b
        );
        assign(priciest, "PREMIUM", "maior preço");
      }
    }

    // Regra 6: restantes → BOM_E_BARATO
    const leftover = candidates.filter((it) => !decisions.has(it.product.id));
    for (const it of leftover) {
      assign(it, "BOM_E_BARATO", "fallback");
    }
  }

  // Relatório
  const byBadge = new Map<Badge, number>();
  for (const d of decisions.values()) {
    byBadge.set(d.badge, (byBadge.get(d.badge) ?? 0) + 1);
  }

  console.log(`─── Resumo ───`);
  console.log(`Produtos que serão atribuídos: ${decisions.size}`);
  for (const [badge, count] of [...byBadge.entries()].sort()) {
    console.log(`  ${badge}: ${count}`);
  }
  console.log("");

  // Amostra (primeiros 15)
  console.log(`─── Amostra (primeiros 15) ───`);
  let i = 0;
  for (const d of decisions.values()) {
    if (i >= 15) break;
    console.log(`  ${d.badge.padEnd(16)} ${d.productName.slice(0, 50).padEnd(50)} ${d.reason}`);
    i++;
  }
  console.log("");

  if (!APPLY) {
    console.log(`Para aplicar no DB, rode: npx tsx scripts/aplicar-selos-heuristica.ts --apply`);
    await db.$disconnect();
    return;
  }

  // Apply
  console.log("Aplicando no DB...");
  let applied = 0;
  for (const d of decisions.values()) {
    await db.product.update({
      where: { id: d.productId },
      data: { badge: d.badge },
    });
    applied++;
    if (applied % 50 === 0) console.log(`  ${applied}/${decisions.size}...`);
  }
  console.log(`✓ ${applied} produtos atualizados.`);

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
