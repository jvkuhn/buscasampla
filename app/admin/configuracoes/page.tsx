import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { InputField, TextareaField } from "@/components/admin/FormField";
import { updateSiteSettings } from "@/lib/actions/settings";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Configurações — Admin" };

export default async function SettingsPage() {
  const settings = await db.siteSettings.findUnique({ where: { id: "default" } });

  return (
    <div>
      <PageHeader title="Configurações do site" />

      <form action={updateSiteSettings} className="space-y-6 max-w-3xl">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-900 border-b pb-3">Identidade</h2>
          <InputField
            label="Nome do site *"
            name="siteName"
            defaultValue={settings?.siteName ?? "Top Rankings"}
            required
          />
          <TextareaField
            label="Descrição do site"
            name="siteDescription"
            defaultValue={settings?.siteDescription ?? ""}
            rows={2}
          />
          <InputField
            label="URL do site"
            name="siteUrl"
            type="url"
            defaultValue={settings?.siteUrl ?? ""}
            placeholder="https://..."
          />
          <InputField
            label="URL do logo"
            name="logoUrl"
            type="url"
            defaultValue={settings?.logoUrl ?? ""}
          />
          <InputField
            label="URL do favicon"
            name="faviconUrl"
            type="url"
            defaultValue={settings?.faviconUrl ?? ""}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-900 border-b pb-3">Rodapé & Compliance</h2>
          <TextareaField
            label="Texto do rodapé"
            name="footerText"
            defaultValue={settings?.footerText ?? ""}
            rows={2}
          />
          <TextareaField
            label="Aviso de afiliados"
            name="affiliateNotice"
            defaultValue={settings?.affiliateNotice ?? ""}
            rows={3}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-900 border-b pb-3">Redes sociais</h2>
          <InputField label="Twitter/X" name="socialTwitter" defaultValue={settings?.socialTwitter ?? ""} />
          <InputField label="Facebook" name="socialFacebook" defaultValue={settings?.socialFacebook ?? ""} />
          <InputField label="Instagram" name="socialInstagram" defaultValue={settings?.socialInstagram ?? ""} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-900 border-b pb-3">Analytics</h2>
          <InputField
            label="Google Tag Manager ID"
            name="gtmId"
            defaultValue={settings?.gtmId ?? ""}
            placeholder="GTM-XXXXXX"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Salvar configurações
          </button>
        </div>
      </form>
    </div>
  );
}
