import Link from "next/link";

interface Props {
  ranking: {
    slug: string;
    title: string;
    subtitle: string | null;
    coverUrl: string | null;
    category: { name: string } | null;
    _count: { items: number };
  };
}

export function RankingCard({ ranking }: Props) {
  return (
    <Link
      href={`/ranking/${ranking.slug}`}
      className="group block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
        {ranking.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ranking.coverUrl}
            alt={ranking.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl font-bold">
            TOP {ranking._count.items}
          </div>
        )}
      </div>
      <div className="p-4">
        {ranking.category && (
          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">
            {ranking.category.name}
          </p>
        )}
        <h3 className="font-semibold text-gray-900 mt-1 group-hover:text-blue-600">
          {ranking.title}
        </h3>
        {ranking.subtitle && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ranking.subtitle}</p>
        )}
      </div>
    </Link>
  );
}
