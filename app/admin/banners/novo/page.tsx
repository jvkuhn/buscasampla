import { PageHeader } from "@/components/admin/PageHeader";
import { BannerForm } from "@/components/admin/BannerForm";
import { createBanner } from "@/lib/actions/settings";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo Banner — Admin" };

export default function NewBannerPage() {
  return (
    <div>
      <PageHeader title="Novo Banner" />
      <BannerForm action={createBanner} />
    </div>
  );
}
