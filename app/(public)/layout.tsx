import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { db } from "@/lib/db";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [categories, settings] = await Promise.all([
    db.category.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { order: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    db.siteSettings.findUnique({ where: { id: "default" } }),
  ]);

  return (
    <>
      <PublicHeader categories={categories} settings={settings} />
      <main className="flex-1">{children}</main>
      <PublicFooter settings={settings} />
    </>
  );
}
