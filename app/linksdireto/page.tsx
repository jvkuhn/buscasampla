import { db } from "@/lib/db";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Links — BuscasAmpla",
  robots: { index: false, follow: false },
};

interface ManualLink {
  label: string;
  url: string;
}

export default async function DirectLinksPage() {
  const settings = await db.siteSettings.findUnique({ where: { id: "default" } });
  const links = (settings?.manualLinks as ManualLink[] | null) ?? [];
  const siteName = settings?.siteName ?? "BuscasAmpla";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">{siteName}</h1>
          <p className="text-blue-200 text-sm mt-1">Links recomendados</p>
        </div>

        {links.length === 0 ? (
          <p className="text-center text-blue-200 text-sm">Nenhum link disponível.</p>
        ) : (
          links.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="block w-full text-center px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-blue-50 hover:scale-[1.02] transition-all shadow-md"
            >
              {link.label}
            </a>
          ))
        )}
      </div>
    </div>
  );
}
