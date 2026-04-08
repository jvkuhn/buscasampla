import { PageHeader } from "@/components/admin/PageHeader";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { createCategory } from "@/lib/actions/categories";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nova Categoria — Admin" };

export default function NewCategoryPage() {
  return (
    <div>
      <PageHeader title="Nova Categoria" />
      <CategoryForm action={createCategory} />
    </div>
  );
}
