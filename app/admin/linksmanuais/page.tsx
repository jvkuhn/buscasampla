import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { updateManualLinks } from "@/lib/actions/settings";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Links Manuais — Admin" };

interface ManualLink {
  label: string;
  url: string;
}

export default async function ManualLinksPage() {
  const settings = await db.siteSettings.findUnique({ where: { id: "default" } });
  const links = (settings?.manualLinks as ManualLink[] | null) ?? [];

  const slots = Array.from({ length: 20 }, (_, i) => ({
    label: links[i]?.label ?? "",
    url: links[i]?.url ?? "",
  }));

  return (
    <div>
      <PageHeader
        title="Links Manuais"
        description="Configure até 20 links diretos. Eles ficam disponíveis em /linksdireto"
      />

      <form action={updateManualLinks} className="space-y-4 max-w-3xl">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          <div className="flex gap-3 text-xs font-medium text-gray-500 uppercase tracking-wide px-1">
            <span className="w-5 shrink-0">#</span>
            <span className="flex-1">Nome</span>
            <span className="flex-[2]">URL</span>
          </div>

          {slots.map((slot, i) => (
            <div key={i} className="flex gap-3 items-center">
              <span className="text-xs text-gray-400 font-mono w-5 shrink-0 text-right">
                {i + 1}
              </span>
              <input
                name={`label_${i}`}
                defaultValue={slot.label}
                placeholder="Ex: Oferta Air Fryer"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                name={`url_${i}`}
                type="url"
                defaultValue={slot.url}
                placeholder="https://..."
                className="flex-[2] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400">
          Linhas com nome ou URL em branco serão ignoradas.
        </p>

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Salvar links
        </button>
      </form>
    </div>
  );
}
