import { db } from "../lib/db";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import "dotenv/config";

/**
 * Dump completo do catalogo antes de apagar.
 *
 * Escreve um JSON unico com rankings, produtos, categorias, links de afiliado e
 * FAQs — tudo que o cleanup destroi. E o unico caminho de volta: nao existe
 * lixeira no banco, e as ~5.9k URLs indexadas nao voltam sozinhas.
 */
async function main() {
  const [categories, products, rankings, links, faqs, pages, settings] = await Promise.all([
    db.category.findMany(),
    db.product.findMany(),
    db.ranking.findMany({ include: { items: true, faqs: true } }),
    db.affiliateLink.findMany(),
    db.fAQ.findMany(),
    db.sitePage.findMany(),
    db.siteSettings.findMany(),
  ]);

  const dump = {
    geradoEm: new Date().toISOString(),
    contagem: {
      categories: categories.length,
      products: products.length,
      rankings: rankings.length,
      affiliateLinks: links.length,
      faqs: faqs.length,
      sitePages: pages.length,
    },
    categories,
    products,
    rankings,
    affiliateLinks: links,
    faqs,
    sitePages: pages,
    siteSettings: settings,
  };

  const dir = join(process.cwd(), "backups");
  mkdirSync(dir, { recursive: true });
  const arquivo = join(dir, `catalogo-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`);

  // Decimal do Prisma nao serializa sozinho; vira string, que e como ele
  // tambem aceita de volta na restauracao.
  writeFileSync(arquivo, JSON.stringify(dump, (_k, v) => (typeof v === "bigint" ? String(v) : v), 2), "utf-8");

  console.log("Backup salvo em:", arquivo);
  console.table(dump.contagem);
}

main()
  .catch((e) => {
    console.error("ERRO:", e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
