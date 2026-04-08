import { db } from "@/lib/db";
import { RankingCard } from "@/components/public/RankingCard";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Busca" };

export default async function SearchPage(props: PageProps<"/busca">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const [rankings, products] = q
    ? await Promise.all([
        db.ranking.findMany({
          where: {
            status: "PUBLISHED",
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { subtitle: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 12,
          include: {
            category: { select: { name: true } },
            _count: { select: { items: true } },
          },
        }),
        db.product.findMany({
          where: {
            status: "PUBLISHED",
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { shortDesc: { contains: q, mode: "insensitive" } },
              { brand: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 12,
        }),
      ])
    : [[], []];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Busca</h1>
      <form action="/busca" className="mt-4 mb-10">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="O que você procura?"
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      {!q ? (
        <p className="text-gray-500">Digite algo para começar.</p>
      ) : (
        <>
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Rankings ({rankings.length})
            </h2>
            {rankings.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhum ranking encontrado.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {rankings.map((r) => <RankingCard key={r.id} ranking={r} />)}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Produtos ({products.length})
            </h2>
            {products.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhum produto encontrado.</p>
            ) : (
              <ul className="divide-y divide-gray-100 bg-white border border-gray-200 rounded-xl overflow-hidden">
                {products.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/produto/${p.slug}`}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50"
                    >
                      {p.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt="" className="w-14 h-14 object-contain rounded bg-gray-50" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{p.name}</p>
                        {p.shortDesc && (
                          <p className="text-sm text-gray-500 truncate">{p.shortDesc}</p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
