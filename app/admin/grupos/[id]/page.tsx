import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { GroupForm } from "@/components/admin/GroupForm";
import { updateGroup } from "@/lib/actions/grupos";
import type { Benefit } from "@/lib/group-content";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editar grupo — Admin" };

export default async function EditGroupPage(props: PageProps<"/admin/grupos/[id]">) {
  const { id } = await props.params;
  const [grupo, categories] = await Promise.all([
    db.whatsAppGroup.findUnique({ where: { id } }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!grupo) notFound();

  // Volta do Json pro formato "Titulo | Descricao" que o textarea edita.
  const benefits = Array.isArray(grupo.benefits)
    ? (grupo.benefits as unknown as Benefit[])
        .map((b) => (b.description ? `${b.title} | ${b.description}` : b.title))
        .join("\n")
    : "";

  const action = updateGroup.bind(null, grupo.id);

  return (
    <div>
      <PageHeader title={`Editar: ${grupo.name}`} />
      <GroupForm
        action={action}
        categories={categories}
        defaultValues={{
          slug: grupo.slug,
          name: grupo.name,
          inviteUrl: grupo.inviteUrl,
          description: grupo.description ?? "",
          active: grupo.active,
          headline: grupo.headline ?? "",
          subheadline: grupo.subheadline ?? "",
          ctaText: grupo.ctaText ?? "",
          benefits,
          memberCount: grupo.memberCount,
          categoryId: grupo.categoryId,
        }}
      />
    </div>
  );
}
