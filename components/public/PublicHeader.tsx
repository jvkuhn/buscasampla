import Link from "next/link";

interface Props {
  categories: { id: string; name: string; slug: string }[];
  settings: { siteName: string; logoUrl: string | null } | null;
}

export function PublicHeader({ categories, settings }: Props) {
  const siteName = settings?.siteName ?? "Top Rankings";

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900">
          {settings?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt={siteName} className="h-8" />
          ) : (
            <span>{siteName}</span>
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-5 text-sm text-gray-700 flex-1">
          <Link href="/categorias" className="hover:text-blue-600">Categorias</Link>
          {categories.slice(0, 5).map((c) => (
            <Link key={c.id} href={`/categorias/${c.slug}`} className="hover:text-blue-600">
              {c.name}
            </Link>
          ))}
        </nav>

        <form action="/busca" className="ml-auto">
          <input
            type="search"
            name="q"
            placeholder="Buscar..."
            className="w-40 md:w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>
      </div>
    </header>
  );
}
