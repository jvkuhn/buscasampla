import { db } from "../lib/db";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import "dotenv/config";

/**
 * Apaga o catalogo: rankings, produtos, FAQs, links de afiliado e categorias.
 * Preserva grupos de WhatsApp, paginas, configuracoes e usuarios.
 *
 * O objetivo do site passou a ser so a captacao para os grupos de afiliado; o
 * catalogo virou peso morto de build e de banco.
 *
 * Recusa rodar sem um backup em backups/: nao existe lixeira no banco, e as
 * ~5.9k URLs indexadas nao voltam sozinhas.
 */
async function main() {
  const dir = join(process.cwd(), "backups");
  const dumps = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")) : [];
  if (dumps.length === 0) {
    throw new Error("Nenhum backup em backups/. Rode 'npm run backup-catalogo' antes.");
  }
  console.log("backup encontrado:", dumps.at(-1));

  const [rankingItems, faqs, affiliateLinks, rankings, products] = await db.$transaction([
    db.rankingItem.deleteMany(),
    db.fAQ.deleteMany(),
    db.affiliateLink.deleteMany(),
    db.ranking.deleteMany(),
    db.product.deleteMany(),
  ]);
  const categories = await db.category.deleteMany();

  console.log("\napagados:");
  console.table({
    rankingItems: rankingItems.count,
    faqs: faqs.count,
    affiliateLinks: affiliateLinks.count,
    rankings: rankings.count,
    products: products.count,
    categories: categories.count,
  });

  console.log("preservados:");
  console.table({
    grupos: await db.whatsAppGroup.count(),
    paginas: await db.sitePage.count(),
    configuracoes: await db.siteSettings.count(),
    usuarios: await db.user.count(),
  });
}

main()
  .catch((e) => {
    console.error("ERRO:", e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
