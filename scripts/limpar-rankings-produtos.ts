// scripts/limpar-rankings-produtos.ts
// Apaga todos os rankings, produtos, FAQs e links de afiliado.
// Mantém: categorias, banners, páginas, configurações, usuários.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🗑️  Limpando rankings e produtos...\n");

  const rankingItems = await db.rankingItem.deleteMany();
  console.log(`  RankingItems: ${rankingItems.count} removidos`);

  const faqs = await db.fAQ.deleteMany();
  console.log(`  FAQs: ${faqs.count} removidas`);

  const affiliateLinks = await db.affiliateLink.deleteMany();
  console.log(`  AffiliateLinks: ${affiliateLinks.count} removidos`);

  const rankings = await db.ranking.deleteMany();
  console.log(`  Rankings: ${rankings.count} removidos`);

  const products = await db.product.deleteMany();
  console.log(`  Produtos: ${products.count} removidos`);

  console.log("\n✅ Banco limpo. Categorias, banners, páginas e config mantidos.");
}

main()
  .catch((err) => {
    console.error("❌ Erro:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
