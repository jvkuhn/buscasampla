import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const CATEGORIES = [
  { name: "Eletrônicos", slug: "eletronicos", description: "Smartphones, notebooks, TVs e gadgets em geral.", order: 1 },
  { name: "Eletrodomésticos", slug: "eletrodomesticos", description: "Geladeiras, fogões, máquinas de lavar e mais.", order: 2 },
  { name: "Cozinha", slug: "cozinha", description: "Utensílios, panelas, formas e acessórios de cozinha.", order: 3 },
  { name: "Casa e Decoração", slug: "casa-decoracao", description: "Móveis, decoração e organização da casa.", order: 4 },
  { name: "Beleza", slug: "beleza", description: "Cosméticos, cuidados pessoais e perfumaria.", order: 5 },
  { name: "Esportes e Fitness", slug: "esportes-fitness", description: "Equipamentos, roupas e acessórios esportivos.", order: 6 },
  { name: "Pet", slug: "pet", description: "Produtos para cães, gatos e outros pets.", order: 7 },
  { name: "Bebê e Infantil", slug: "bebe-infantil", description: "Produtos para bebês, crianças e mamães.", order: 8 },
  { name: "Ferramentas", slug: "ferramentas", description: "Ferramentas manuais, elétricas e jardim.", order: 9 },
  { name: "Periféricos e Gamer", slug: "perifericos-gamer", description: "Mouses, teclados, headsets e setup gamer.", order: 10 },
  { name: "Automotivo", slug: "automotivo", description: "Acessórios, peças e produtos para carros.", order: 11 },
  { name: "Saúde e Bem-estar", slug: "saude-bem-estar", description: "Suplementos, equipamentos e cuidados com a saúde.", order: 12 },
];

async function main() {
  console.log("🌱 Seedando categorias padrão...");
  for (const cat of CATEGORIES) {
    await db.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, order: cat.order },
      create: { ...cat, status: "PUBLISHED" },
    });
    console.log(`✔ ${cat.name}`);
  }
  console.log("✅ Categorias prontas.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
