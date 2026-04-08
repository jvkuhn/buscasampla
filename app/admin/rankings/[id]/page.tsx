import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { RankingForm } from "@/components/admin/RankingForm";
import { RankingItemsManager } from "@/components/admin/RankingItemsManager";
import { FAQManager } from "@/components/admin/FAQManager";
import { updateRanking } from "@/lib/actions/rankings";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editar Ranking — Admin" };

export default async function EditRankingPage(props: PageProps<"/admin/rankings/[id]">) {
  const { id } = await props.params;

  const [ranking, categories, products] = await Promise.all([
    db.ranking.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { order: "asc" },
          include: { product: { select: { id: true, name: true, imageUrl: true } } },
        },
        faqs: { orderBy: { order: "asc" } },
      },
    }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!ranking) notFound();

  const updateWithId = updateRanking.bind(null, id);

  return (
    <div className="space-y-6">
      <PageHeader title={`Editar: ${ranking.title}`} />

      <RankingForm
        action={updateWithId}
        categories={categories}
        defaultValues={{
          title: ranking.title,
          slug: ranking.slug,
          subtitle: ranking.subtitle ?? "",
          intro: ranking.intro ?? "",
          conclusion: ranking.conclusion ?? "",
          coverUrl: ranking.coverUrl ?? "",
          metaTitle: ranking.metaTitle ?? "",
          metaDesc: ranking.metaDesc ?? "",
          ogTitle: ranking.ogTitle ?? "",
          ogDesc: ranking.ogDesc ?? "",
          ogImageUrl: ranking.ogImageUrl ?? "",
          status: ranking.status,
          categoryId: ranking.categoryId,
        }}
      />

      <div className="max-w-3xl">
        <RankingItemsManager
          rankingId={ranking.id}
          items={ranking.items.map((it) => ({
            id: it.id,
            order: it.order,
            product: it.product,
          }))}
          products={products}
        />
      </div>

      <div className="max-w-3xl">
        <FAQManager rankingId={ranking.id} faqs={ranking.faqs} />
      </div>
    </div>
  );
}
