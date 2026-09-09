import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { GroupForm } from "@/components/admin/GroupForm";
import { updateGroup } from "@/lib/actions/grupos";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editar grupo — Admin" };

export default async function EditGroupPage(props: PageProps<"/admin/grupos/[id]">) {
  const { id } = await props.params;
  const grupo = await db.whatsAppGroup.findUnique({ where: { id } });
  if (!grupo) notFound();

  const action = updateGroup.bind(null, grupo.id);

  return (
    <div>
      <PageHeader title={`Editar: ${grupo.name}`} />
      <GroupForm
        action={action}
        defaultValues={{
          slug: grupo.slug,
          name: grupo.name,
          inviteUrl: grupo.inviteUrl,
          description: grupo.description ?? "",
          active: grupo.active,
        }}
      />
    </div>
  );
}
