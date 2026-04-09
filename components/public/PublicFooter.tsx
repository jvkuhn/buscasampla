import Link from "next/link";

interface Props {
  settings: {
    siteName: string;
    footerText: string | null;
    affiliateNotice: string | null;
    socialTwitter: string | null;
    socialFacebook: string | null;
    socialInstagram: string | null;
  } | null;
  pages?: { title: string; slug: string }[];
}

export function PublicFooter({ settings, pages = [] }: Props) {
  const year = new Date().getFullYear();
  const siteName = settings?.siteName ?? "Top Rankings";

  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        {settings?.affiliateNotice && (
          <p className="text-xs text-gray-500 bg-white border border-gray-200 rounded-lg p-4">
            {settings.affiliateNotice}
          </p>
        )}

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm text-gray-600">
          <div>
            <p className="font-semibold text-gray-900">{siteName}</p>
            {settings?.footerText && <p className="text-xs mt-1">{settings.footerText}</p>}
          </div>

          <nav className="flex gap-4 text-xs">
            <Link href="/categorias" className="hover:text-blue-600">Categorias</Link>
            {pages.map((page) => (
              <Link key={page.slug} href={`/p/${page.slug}`} className="hover:text-blue-600">
                {page.title}
              </Link>
            ))}
          </nav>
        </div>

        <p className="text-xs text-gray-400">© {year} {siteName}. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
