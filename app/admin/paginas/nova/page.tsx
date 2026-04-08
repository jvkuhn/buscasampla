import { PageHeader } from "@/components/admin/PageHeader";
import { SitePageForm } from "@/components/admin/SitePageForm";
import { createSitePage } from "@/lib/actions/settings";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nova Página — Admin" };

export default function NewSitePagePage() {
  return (
    <div>
      <PageHeader title="Nova Página" />
      <SitePageForm action={createSitePage} />
    </div>
  );
}
