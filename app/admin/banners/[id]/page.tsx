import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { BannerForm } from "@/components/admin/BannerForm";
import { updateBanner } from "@/lib/actions/settings";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editar Banner — Admin" };

export default async function EditBannerPage(props: PageProps<"/admin/banners/[id]">) {
  const { id } = await props.params;
  const banner = await db.banner.findUnique({ where: { id } });
  if (!banner) notFound();

  const updateWithId = updateBanner.bind(null, id);

  return (
    <div>
      <PageHeader title={`Editar: ${banner.title}`} />
      <BannerForm
        action={updateWithId}
        defaultValues={{
          title: banner.title,
          subtitle: banner.subtitle ?? "",
          imageUrl: banner.imageUrl ?? "",
          linkUrl: banner.linkUrl ?? "",
          linkLabel: banner.linkLabel ?? "",
          position: banner.position,
          active: banner.active,
          order: banner.order,
        }}
      />
    </div>
  );
}
