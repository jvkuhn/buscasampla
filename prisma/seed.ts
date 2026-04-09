import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // ─── Admin user ─────────────────────────────────────────────────────────────
  const email = process.env.SEED_ADMIN_EMAIL || "admin@admin.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "admin123";
  const hashed = await bcrypt.hash(password, 10);

  await db.user.upsert({
    where: { email },
    update: {},
    create: { email, password: hashed, name: "Admin", role: "ADMIN" },
  });
  console.log(`✔ Admin: ${email}`);

  // ─── Site settings ──────────────────────────────────────────────────────────
  await db.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      siteName: "Top Rankings",
      siteDescription: "Comparativos e rankings dos melhores produtos.",
      footerText: "Seu guia imparcial de compras.",
      affiliateNotice:
        "Este site pode receber comissões sobre compras feitas através dos links exibidos. Isso não afeta o preço final para você.",
    },
  });
  console.log("✔ Site settings");

  // ─── Categorias ─────────────────────────────────────────────────────────────
  const perifericos = await db.category.upsert({
    where: { slug: "perifericos" },
    update: {},
    create: {
      name: "Periféricos",
      slug: "perifericos",
      description: "Mouses, teclados, headsets e mais para seu setup.",
      status: "PUBLISHED",
      order: 1,
    },
  });

  await db.category.upsert({
    where: { slug: "cozinha" },
    update: {},
    create: {
      name: "Cozinha",
      slug: "cozinha",
      description: "Utensílios e eletrodomésticos para a cozinha.",
      status: "PUBLISHED",
      order: 2,
    },
  });

  console.log("✔ Categorias");

  // ─── Produtos ───────────────────────────────────────────────────────────────
  const mouse1 = await db.product.upsert({
    where: { slug: "logitech-g-pro-x-superlight" },
    update: {},
    create: {
      name: "Logitech G Pro X Superlight",
      slug: "logitech-g-pro-x-superlight",
      brand: "Logitech",
      shortDesc: "Mouse wireless ultraleve para e-sports profissional.",
      longDesc:
        "Mouse sem fio de 63g com sensor HERO 25K, bateria de até 70h e receptor LIGHTSPEED.",
      imageUrl: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=600",
      currentPrice: 899.0,
      oldPrice: 1199.0,
      rating: 4.8,
      pros: ["Extremamente leve", "Bateria duradoura", "Sensor preciso"],
      cons: ["Preço elevado", "Sem RGB"],
      badge: "PREMIUM",
      status: "PUBLISHED",
      categoryId: perifericos.id,
      affiliateLinks: {
        create: [
          { platform: "amazon", url: "https://amazon.com.br", label: "Ver na Amazon" },
          { platform: "mercadolivre", url: "https://mercadolivre.com.br", label: "Ver no ML" },
        ],
      },
    },
  });

  const mouse2 = await db.product.upsert({
    where: { slug: "razer-deathadder-v3" },
    update: {},
    create: {
      name: "Razer DeathAdder V3",
      slug: "razer-deathadder-v3",
      brand: "Razer",
      shortDesc: "Ergonomia clássica com sensor Focus Pro 30K.",
      imageUrl: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600",
      currentPrice: 549.0,
      rating: 4.7,
      pros: ["Ótima ergonomia", "Sensor top"],
      cons: ["Cabo um pouco rígido"],
      badge: "BEST_VALUE",
      status: "PUBLISHED",
      categoryId: perifericos.id,
      affiliateLinks: {
        create: [{ platform: "amazon", url: "https://amazon.com.br", label: "Comprar" }],
      },
    },
  });

  const mouse3 = await db.product.upsert({
    where: { slug: "redragon-cobra" },
    update: {},
    create: {
      name: "Redragon Cobra M711",
      slug: "redragon-cobra",
      brand: "Redragon",
      shortDesc: "Mouse gamer com ótimo custo-benefício e RGB.",
      imageUrl: "https://images.unsplash.com/photo-1586816001966-79b736744398?w=600",
      currentPrice: 129.9,
      rating: 4.4,
      pros: ["Barato", "RGB bonito"],
      cons: ["Sensor mediano"],
      badge: "CHEAPEST",
      status: "PUBLISHED",
      categoryId: perifericos.id,
      affiliateLinks: {
        create: [{ platform: "shopee", url: "https://shopee.com.br", label: "Shopee" }],
      },
    },
  });

  console.log("✔ Produtos");

  // ─── Ranking ────────────────────────────────────────────────────────────────
  const ranking = await db.ranking.upsert({
    where: { slug: "top-10-mouses-gamer" },
    update: {},
    create: {
      title: "Top 10 Mouses Gamer em 2026",
      slug: "top-10-mouses-gamer",
      subtitle: "Os melhores mouses para jogar, do básico ao profissional.",
      intro:
        "Escolher um bom mouse gamer faz toda a diferença na sua gameplay. Separamos os 10 melhores modelos disponíveis no mercado, considerando sensor, ergonomia, peso, bateria e custo-benefício.",
      conclusion:
        "Qualquer um dos mouses desta lista é uma ótima escolha. Se o orçamento permite, o Logitech G Pro X Superlight é o nosso favorito geral.",
      status: "PUBLISHED",
      categoryId: perifericos.id,
      metaTitle: "Top 10 Mouses Gamer 2026",
      metaDesc: "Ranking dos 10 melhores mouses gamer, com prós, contras, preço e onde comprar.",
    },
  });

  // Adiciona itens ao ranking (limpa antes para idempotência)
  await db.rankingItem.deleteMany({ where: { rankingId: ranking.id } });
  await db.rankingItem.createMany({
    data: [
      { rankingId: ranking.id, productId: mouse1.id, order: 1 },
      { rankingId: ranking.id, productId: mouse2.id, order: 2 },
      { rankingId: ranking.id, productId: mouse3.id, order: 3 },
    ],
  });

  // FAQs
  await db.fAQ.deleteMany({ where: { rankingId: ranking.id } });
  await db.fAQ.createMany({
    data: [
      {
        rankingId: ranking.id,
        question: "Qual é o melhor mouse gamer?",
        answer: "Para a maioria dos jogadores profissionais, o Logitech G Pro X Superlight é a referência.",
        order: 0,
      },
      {
        rankingId: ranking.id,
        question: "Vale a pena um mouse sem fio?",
        answer: "Sim — os modelos wireless atuais têm latência equivalente aos com fio e liberam o setup.",
        order: 1,
      },
    ],
  });

  console.log("✔ Ranking com itens e FAQs");

  // ─── Banner home ────────────────────────────────────────────────────────────
  await db.banner.upsert({
    where: { id: "home-welcome" },
    update: {},
    create: {
      id: "home-welcome",
      title: "Os melhores produtos, comparados e ranqueados",
      subtitle: "Listas Top 10 imparciais com prós, contras, preço e onde comprar.",
      position: "home_top",
      active: true,
      order: 0,
    },
  });

  // ─── Páginas institucionais ─────────────────────────────────────────────────
  await db.sitePage.upsert({
    where: { slug: "sobre" },
    update: {},
    create: {
      slug: "sobre",
      title: "Sobre nós",
      content: "<p>Somos um portal independente de reviews e comparativos.</p>",
      status: "PUBLISHED",
    },
  });

  console.log("🌱 Seed concluído!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
