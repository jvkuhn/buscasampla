import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { GTMGate } from "@/components/public/GTMGate";
import { GTMNoScriptGate } from "@/components/public/GTMNoScriptGate";
import { GoogleAnalyticsGate } from "@/components/public/GoogleAnalyticsGate";
import { MetaPixelGate } from "@/components/public/MetaPixelGate";
import { CookieBanner } from "@/components/public/CookieBanner";
import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";

// revalidate false pelo mesmo motivo das paginas: o menor revalidate do tree
// define o da rota, entao 300 aqui anulava o cache de todas elas.
const getCategories = unstable_cache(
  () => db.category.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    select: { id: true, name: true, slug: true },
  }),
  ["public-categories"],
  { revalidate: false }
);

const getSettings = unstable_cache(
  () => db.siteSettings.findFirst({ where: { id: "default" } }),
  ["site-settings"],
  { revalidate: false }
);

const getPages = unstable_cache(
  () => db.sitePage.findMany({
    where: { status: "PUBLISHED" },
    select: { title: true, slug: true },
    orderBy: { title: "asc" },
  }),
  ["public-pages"],
  { revalidate: false }
);

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [categories, settings, pages] = await Promise.all([
    getCategories(),
    getSettings(),
    getPages(),
  ]);

  const gtmId = settings?.gtmId;
  const metaPixelId = settings?.metaPixelId;

  return (
    <>
      {gtmId && <GTMGate gtmId={gtmId} />}
      {gtmId && <GTMNoScriptGate gtmId={gtmId} />}
      {metaPixelId && <MetaPixelGate pixelId={metaPixelId} />}
      <GoogleAnalyticsGate />
      <PublicHeader categories={categories} settings={settings} />
      <main className="flex-1">{children}</main>
      <PublicFooter settings={settings} pages={pages} />
      <CookieBanner />
    </>
  );
}
