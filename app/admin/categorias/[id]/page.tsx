import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { updateCategory } from "@/lib/actions/categories";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editar Categoria — Admin" };

export default async function EditCategoryPage(props: PageProps<"/admin/categorias/[id]">) {
  const { id } = await props.params;
  const category = await db.category.findUnique({ where: { id } });
  if (!category) notFound();

  const updateWithId = updateCategory.bind(null, id);

  return (
    <div>
      <PageHeader title={`Editar: ${category.name}`} />
      <CategoryForm
        action={updateWithId}
        defaultValues={{
          name: category.name,
          slug: category.slug,
          description: category.description ?? "",
          imageUrl: category.imageUrl ?? "",
          metaTitle: category.metaTitle ?? "",
          metaDesc: category.metaDesc ?? "",
          status: category.status,
          order: category.order,
        }}
      />
    </div>
  );
}
