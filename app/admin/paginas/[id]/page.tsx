import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { SitePageForm } from "@/components/admin/SitePageForm";
import { updateSitePage } from "@/lib/actions/settings";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editar Página — Admin" };

export default async function EditSitePagePage(props: PageProps<"/admin/paginas/[id]">) {
  const { id } = await props.params;
  const page = await db.sitePage.findUnique({ where: { id } });
  if (!page) notFound();

  const updateWithId = updateSitePage.bind(null, id);

  return (
    <div>
      <PageHeader title={`Editar: ${page.title}`} />
      <SitePageForm
        action={updateWithId}
        defaultValues={{
          title: page.title,
          slug: page.slug,
          content: page.content,
          metaTitle: page.metaTitle ?? "",
          metaDesc: page.metaDesc ?? "",
          status: page.status,
        }}
      />
    </div>
  );
}
