import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { GTMHead, GTMNoScript } from "@/components/public/GoogleTagManager";
import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";

const getCategories = unstable_cache(
  () => db.category.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    select: { id: true, name: true, slug: true },
  }),
  ["public-categories"],
  { revalidate: 300 }
);

const getSettings = unstable_cache(
  () => db.siteSettings.findFirst({ where: { id: "default" } }),
  ["site-settings"],
  { revalidate: 300 }
);

const getPages = unstable_cache(
  () => db.sitePage.findMany({
    where: { status: "PUBLISHED" },
    select: { title: true, slug: true },
    orderBy: { title: "asc" },
  }),
  ["public-pages"],
  { revalidate: 300 }
);

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [categories, settings, pages] = await Promise.all([
    getCategories(),
    getSettings(),
    getPages(),
  ]);

  const gtmId = settings?.gtmId;

  return (
    <>
      {gtmId && <GTMHead gtmId={gtmId} />}
      {gtmId && <GTMNoScript gtmId={gtmId} />}
      <PublicHeader categories={categories} settings={settings} />
      <main className="flex-1">{children}</main>
      <PublicFooter settings={settings} pages={pages} />
    </>
  );
}
