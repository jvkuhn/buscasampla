import { PageHeader } from "@/components/admin/PageHeader";
import { GroupForm } from "@/components/admin/GroupForm";
import { createGroup } from "@/lib/actions/grupos";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo grupo — Admin" };

export default function NewGroupPage() {
  return (
    <div>
      <PageHeader title="Novo grupo de WhatsApp" />
      <GroupForm action={createGroup} />
    </div>
  );
}
