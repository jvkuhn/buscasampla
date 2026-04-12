/**
 * Gera um snapshot de status dos produtos cadastrados em scripts/status-produtos.txt.
 *
 * Formato: similar ao fila-top10.txt em espírito (arquivo texto legível, editável,
 * commitável), mas é uma foto do estado atual do DB, não uma fila de trabalho.
 *
 * Uso:
 *   npx tsx scripts/gerar-status-produtos.ts
 *
 * Flags por campo:
 *   I = imageUrl        R = rating
 *   B = badge           D = shortDesc ou longDesc
 *   P = currentPrice    L = >= 1 affiliateLink
 *
 * Formato:
 *   [IPBRDL] Nome (slug) — categoria — badge  → completo
 *   [I_B__L] Nome (slug) — categoria — null   → incompleto
 */

import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

const db = new PrismaClient();

function flag(v: boolean, letter: string): string {
  return v ? letter : "_";
}

async function main() {
  const products = await db.product.findMany({
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    include: {
      category: { select: { name: true } },
      _count: { select: { affiliateLinks: true } },
    },
  });

  const lines: string[] = [];
  const summary = {
    total: products.length,
    published: 0,
    completo: 0,
    semImagem: 0,
    semPreco: 0,
    semBadge: 0,
    semRating: 0,
    semDesc: 0,
    semLinks: 0,
  };

  const now = new Date();
  const timestamp = now.toISOString().replace("T", " ").slice(0, 16);

  lines.push(`# Status dos produtos — snapshot em ${timestamp} UTC`);
  lines.push(`# Gerado por: npx tsx scripts/gerar-status-produtos.ts`);
  lines.push(`# Flags: [IPBRDL] = Imagem Preco Badge Rating Desc Links`);
  lines.push(`# _ = campo ausente.  Produto completo quando todas as 6 letras presentes.`);
  lines.push("");
  lines.push("# ─── Produtos ───");

  for (const p of products) {
    if (p.status === "PUBLISHED") summary.published++;

    const hasImage = !!p.imageUrl;
    const hasPrice = p.currentPrice != null;
    const hasBadge = p.badge != null;
    const hasRating = p.rating != null;
    const hasDesc = !!(p.shortDesc || p.longDesc);
    const hasLinks = p._count.affiliateLinks > 0;

    if (!hasImage) summary.semImagem++;
    if (!hasPrice) summary.semPreco++;
    if (!hasBadge) summary.semBadge++;
    if (!hasRating) summary.semRating++;
    if (!hasDesc) summary.semDesc++;
    if (!hasLinks) summary.semLinks++;

    if (hasImage && hasPrice && hasBadge && hasRating && hasDesc && hasLinks) {
      summary.completo++;
    }

    const flagStr = `[${flag(hasImage, "I")}${flag(hasPrice, "P")}${flag(hasBadge, "B")}${flag(hasRating, "R")}${flag(hasDesc, "D")}${flag(hasLinks, "L")}]`;

    const catName = p.category?.name ?? "—";
    const badgeStr = p.badge ?? "null";
    lines.push(`${flagStr} ${p.name} (${p.slug}) — ${catName} — ${badgeStr}`);
  }

  lines.push("");
  lines.push("# ─── Resumo ───");
  lines.push(`# Total: ${summary.total}`);
  lines.push(`# Publicados: ${summary.published}`);
  lines.push(`# Completos (6/6 flags): ${summary.completo} (${((summary.completo / summary.total) * 100).toFixed(1)}%)`);
  lines.push(`# Sem imagem: ${summary.semImagem}`);
  lines.push(`# Sem preço: ${summary.semPreco}`);
  lines.push(`# Sem badge: ${summary.semBadge}`);
  lines.push(`# Sem rating: ${summary.semRating}`);
  lines.push(`# Sem descrição: ${summary.semDesc}`);
  lines.push(`# Sem link de afiliado: ${summary.semLinks}`);
  lines.push("");

  const out = lines.join("\n") + "\n";
  writeFileSync("scripts/status-produtos.txt", out, "utf-8");

  console.log(`✓ Escrito scripts/status-produtos.txt — ${summary.total} produtos, ${summary.completo} completos.`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
