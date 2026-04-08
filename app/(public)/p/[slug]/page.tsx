import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { Metadata } from "next";

export async function generateMetadata(
  props: PageProps<"/p/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await db.sitePage.findUnique({ where: { slug } });
  if (!p) return {};
  return {
    title: p.metaTitle || p.title,
    description: p.metaDesc || undefined,
    alternates: { canonical: `/p/${p.slug}` },
  };
}

export default async function SitePageRoute(props: PageProps<"/p/[slug]">) {
  const { slug } = await props.params;
  const page = await db.sitePage.findUnique({ where: { slug } });
  if (!page || page.status !== "PUBLISHED") notFound();

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{page.title}</h1>
      <div
        className="prose prose-gray max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </article>
  );
}
