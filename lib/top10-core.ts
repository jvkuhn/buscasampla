import { db } from "./db";
import { top10Schema, type Top10Input, type Top10ProductInput } from "./validations";
import { slugify } from "./utils";
import type { Ranking } from "@prisma/client";

function randomSuffix() {
  return Math.random().toString(36).slice(2, 6);
}

async function uniqueProductSlug(name: string): Promise<string> {
  const base = slugify(name);
  const exists = await db.product.findUnique({ where: { slug: base } });
  if (!exists) return base;
  for (let i = 0; i < 5; i++) {
    const candidate = `${base}-${randomSuffix()}`;
    const taken = await db.product.findUnique({ where: { slug: candidate } });
    if (!taken) return candidate;
  }
  return `${base}-${Date.now()}`;
}

async function uniqueRankingSlug(title: string): Promise<string> {
  const base = slugify(title);
  const exists = await db.ranking.findUnique({ where: { slug: base } });
  if (!exists) return base;
  for (let i = 0; i < 5; i++) {
    const candidate = `${base}-${randomSuffix()}`;
    const taken = await db.ranking.findUnique({ where: { slug: candidate } });
    if (!taken) return candidate;
  }
  return `${base}-${Date.now()}`;
}

function buildAffiliateLinks(p: Top10ProductInput) {
  const links: { platform: string; url: string; label: string }[] = [];
  if (p.amazonUrl) links.push({ platform: "amazon", url: p.amazonUrl, label: "Ver na Amazon" });
  if (p.mercadoLivreUrl) links.push({ platform: "mercadolivre", url: p.mercadoLivreUrl, label: "Ver no Mercado Livre" });
  if (p.shopeeUrl) links.push({ platform: "shopee", url: p.shopeeUrl, label: "Ver na Shopee" });
  return links;
}

export async function createTop10RankingData(input: Top10Input): Promise<Ranking> {
  const parsed = top10Schema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Dados inválidos: " + JSON.stringify(parsed.error.flatten()));
  }
  const data = parsed.data;

  const rankingSlug = await uniqueRankingSlug(data.ranking.title);
  const productSlugs: string[] = [];
  for (const p of data.products) {
    productSlugs.push(await uniqueProductSlug(p.name));
  }

  const created = await db.$transaction(async (tx) => {
    const createdProducts = await Promise.all(
      data.products.map((p, i) =>
        tx.product.create({
          data: {
            name: p.name,
            slug: productSlugs[i],
            brand: p.brand || null,
            shortDesc: p.shortDesc || null,
            longDesc: p.longDesc || null,
            imageUrl: p.imageUrl || null,
            currentPrice: p.currentPrice ?? null,
            oldPrice: p.oldPrice ?? null,
            rating: p.rating ?? null,
            pros: p.pros?.filter((s) => s.trim()) ?? [],
            cons: p.cons?.filter((s) => s.trim()) ?? [],
            badge: p.badge ?? null,
            categoryId: data.ranking.categoryId || null,
            status: "PUBLISHED",
            affiliateLinks: { create: buildAffiliateLinks(p) },
          },
        })
      )
    );

    const ranking = await tx.ranking.create({
      data: {
        title: data.ranking.title,
        slug: rankingSlug,
        subtitle: data.ranking.subtitle || null,
        intro: data.ranking.intro || null,
        conclusion: data.ranking.conclusion || null,
        coverUrl: data.ranking.coverUrl || null,
        metaTitle: data.ranking.metaTitle || null,
        metaDesc: data.ranking.metaDesc || null,
        categoryId: data.ranking.categoryId || null,
        status: "DRAFT",
      },
    });

    await tx.rankingItem.createMany({
      data: createdProducts.map((prod, idx) => ({
        rankingId: ranking.id,
        productId: prod.id,
        order: idx + 1,
      })),
    });

    if (data.faqs?.length) {
      await tx.fAQ.createMany({
        data: data.faqs.map((f, idx) => ({
          rankingId: ranking.id,
          question: f.question,
          answer: f.answer,
          order: idx,
        })),
      });
    }

    return ranking;
  }, { timeout: 20000 });

  return created;
}
