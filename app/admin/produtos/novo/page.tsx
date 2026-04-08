import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { createProduct } from "@/lib/actions/products";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo Produto — Admin" };

export default async function NewProductPage() {
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <PageHeader title="Novo Produto" />
      <ProductForm action={createProduct} categories={categories} />
    </div>
  );
}
