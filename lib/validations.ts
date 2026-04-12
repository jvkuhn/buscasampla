import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug inválido (use letras, números e hífens)"),
  description: z.string().optional(),
  imageUrl: z.url().optional().or(z.literal("")),
  metaTitle: z.string().max(70).optional(),
  metaDesc: z.string().max(160).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  order: z.coerce.number().int().min(0),
});

export const affiliateLinkSchema = z.object({
  platform: z.string().min(1),
  url: z.url("URL inválida"),
  label: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  shortDesc: z.string().max(300).optional(),
  longDesc: z.string().optional(),
  imageUrl: z.url().optional().or(z.literal("")),
  gallery: z.array(z.url()).optional(),
  currentPrice: z.coerce.number().positive().optional().nullable(),
  oldPrice: z.coerce.number().positive().optional().nullable(),
  priceRange: z.string().optional(),
  rating: z.coerce.number().min(0).max(5).optional().nullable(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  brand: z.string().optional(),
  specs: z.record(z.string(), z.string()).optional(),
  badge: z.enum(["MELHOR_ESCOLHA", "CUSTO_BENEFICIO", "MAIS_VENDIDO", "PREMIUM", "RECOMENDADO", "BOM_E_BARATO"]).optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  categoryId: z.string().optional().nullable(),
});

export const rankingSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  subtitle: z.string().optional(),
  intro: z.string().optional(),
  conclusion: z.string().optional(),
  coverUrl: z.url().optional().or(z.literal("")),
  metaTitle: z.string().max(70).optional(),
  metaDesc: z.string().max(160).optional(),
  ogTitle: z.string().max(70).optional(),
  ogDesc: z.string().max(200).optional(),
  ogImageUrl: z.url().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  categoryId: z.string().optional().nullable(),
});

export const faqSchema = z.object({
  question: z.string().min(5),
  answer: z.string().min(10),
  order: z.coerce.number().int().min(0),
  rankingId: z.string().optional().nullable(),
});

export const bannerSchema = z.object({
  title: z.string().min(2),
  subtitle: z.string().optional(),
  imageUrl: z.url().optional().or(z.literal("")),
  linkUrl: z.url().optional().or(z.literal("")),
  linkLabel: z.string().optional(),
  position: z.enum(["home_top", "home_mid", "sidebar"]),
  active: z.boolean(),
  order: z.coerce.number().int().min(0),
});

export const sitePageSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  content: z.string(),
  metaTitle: z.string().max(70).optional(),
  metaDesc: z.string().max(160).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

export const siteSettingsSchema = z.object({
  siteName: z.string().min(1),
  siteDescription: z.string().optional(),
  siteUrl: z.url().optional().or(z.literal("")),
  logoUrl: z.url().optional().or(z.literal("")),
  faviconUrl: z.url().optional().or(z.literal("")),
  footerText: z.string().optional(),
  affiliateNotice: z.string().optional(),
  socialTwitter: z.string().optional(),
  socialFacebook: z.string().optional(),
  socialInstagram: z.string().optional(),
  // Formato: GTM-XXXXXXX. Validado estritamente pra evitar injecao no template
  // JS do GoogleTagManager.tsx (${gtmId} interpolado em string JS inline).
  gtmId: z
    .string()
    .regex(/^GTM-[A-Z0-9]+$/, "ID do GTM deve estar no formato GTM-XXXXXXX")
    .optional()
    .or(z.literal("")),
});

export const manualLinkSchema = z.object({
  label: z.string().min(1),
  url: z.url(),
});

// ─── Top 10 (criação em massa) ───────────────────────────────────────────────

export const top10ProductSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  brand: z.string().optional(),
  shortDesc: z.string().max(300).optional(),
  longDesc: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  currentPrice: z.coerce.number().positive().optional().nullable(),
  oldPrice: z.coerce.number().positive().optional().nullable(),
  rating: z.coerce.number().min(0).max(5).optional().nullable(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  badge: z.enum(["MELHOR_ESCOLHA", "CUSTO_BENEFICIO", "MAIS_VENDIDO", "PREMIUM", "RECOMENDADO", "BOM_E_BARATO"]).optional().nullable(),
  amazonUrl: z.string().url().optional().or(z.literal("")),
  mercadoLivreUrl: z.string().url().optional().or(z.literal("")),
  shopeeUrl: z.string().url().optional().or(z.literal("")),
});

export const top10FaqSchema = z.object({
  question: z.string().min(5),
  answer: z.string().min(5),
});

export const top10Schema = z.object({
  ranking: z.object({
    title: z.string().min(3, "Título obrigatório"),
    subtitle: z.string().optional(),
    intro: z.string().optional(),
    conclusion: z.string().optional(),
    coverUrl: z.string().url().optional().or(z.literal("")),
    metaTitle: z.string().max(70).optional(),
    metaDesc: z.string().max(160).optional(),
    categoryId: z.string().optional().nullable(),
  }),
  products: z.array(top10ProductSchema).min(1).max(20),
  faqs: z.array(top10FaqSchema).optional(),
});

export type Top10Input = z.infer<typeof top10Schema>;
export type Top10ProductInput = z.infer<typeof top10ProductSchema>;

export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type RankingInput = z.infer<typeof rankingSchema>;
export type FAQInput = z.infer<typeof faqSchema>;
export type BannerInput = z.infer<typeof bannerSchema>;
export type SitePageInput = z.infer<typeof sitePageSchema>;
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
