import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { GroupForm } from "@/components/admin/GroupForm";
import { createGroup } from "@/lib/actions/grupos";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo grupo — Admin" };

export default async function NewGroupPage() {
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <PageHeader title="Novo grupo de WhatsApp" />
      <GroupForm action={createGroup} categories={categories} />
    </div>
  );
}
