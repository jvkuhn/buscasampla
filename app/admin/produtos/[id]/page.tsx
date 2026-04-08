import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { AffiliateLinksManager } from "@/components/admin/AffiliateLinksManager";
import { updateProduct } from "@/lib/actions/products";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editar Produto — Admin" };

export default async function EditProductPage(props: PageProps<"/admin/produtos/[id]">) {
  const { id } = await props.params;
  const [product, categories] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: { affiliateLinks: { orderBy: { createdAt: "asc" } } },
    }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  const updateWithId = updateProduct.bind(null, id);

  return (
    <div className="space-y-6">
      <PageHeader title={`Editar: ${product.name}`} />
      <ProductForm
        action={updateWithId}
        categories={categories}
        defaultValues={{
          name: product.name,
          slug: product.slug,
          shortDesc: product.shortDesc ?? "",
          longDesc: product.longDesc ?? "",
          imageUrl: product.imageUrl ?? "",
          gallery: product.gallery ?? [],
          currentPrice: product.currentPrice,
          oldPrice: product.oldPrice,
          priceRange: product.priceRange ?? "",
          rating: product.rating,
          pros: product.pros ?? [],
          cons: product.cons ?? [],
          brand: product.brand ?? "",
          badge: product.badge,
          status: product.status,
          categoryId: product.categoryId,
        }}
      />

      <div className="max-w-3xl">
        <AffiliateLinksManager
          productId={product.id}
          links={product.affiliateLinks.map((l) => ({
            id: l.id,
            platform: l.platform,
            url: l.url,
            label: l.label,
          }))}
        />
      </div>
    </div>
  );
}
