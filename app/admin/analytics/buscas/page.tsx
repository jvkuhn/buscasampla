import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { getSearchLogs } from "@/lib/analytics";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Log de Buscas — Admin" };
export const dynamic = "force-dynamic";

export default async function SearchLogsPage(
  props: PageProps<"/admin/analytics/buscas">
) {
  const sp = await props.searchParams;
  const page = typeof sp.page === "string" ? parseInt(sp.page, 10) || 1 : 1;
  const onlyNoResults = sp.semranking === "1";
  const queryFilter = typeof sp.q === "string" ? sp.q.trim() : "";

  const { rows, total, totalPages } = await getSearchLogs({
    page,
    onlyNoResults,
    query: queryFilter || undefined,
  });

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const next = {
      page: String(page),
      semranking: onlyNoResults ? "1" : undefined,
      q: queryFilter || undefined,
      ...overrides,
    };
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `/admin/analytics/buscas?${qs}` : "/admin/analytics/buscas";
  };

  return (
    <div>
      <PageHeader
        title="Log de Buscas"
        description="Tudo que os visitantes pesquisaram no site"
        action={{ href: "/admin/analytics", label: "← Voltar para Analytics" }}
      />

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <form
          action="/admin/analytics/buscas"
          method="get"
          className="flex flex-wrap gap-3 items-center"
        >
          <input
            type="text"
            name="q"
            defaultValue={queryFilter}
            placeholder="Filtrar por termo…"
            className="flex-1 min-w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="semranking"
              value="1"
              defaultChecked={onlyNoResults}
              className="rounded border-gray-300"
            />
            Só sem ranking
          </label>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            Filtrar
          </button>
          {(onlyNoResults || queryFilter) && (
            <Link
              href="/admin/analytics/buscas"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Limpar
            </Link>
          )}
        </form>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        <span className="font-semibold text-gray-900">{total}</span>{" "}
        {total === 1 ? "busca registrada" : "buscas registradas"}
        {(onlyNoResults || queryFilter) && " (filtrado)"}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Nenhuma busca registrada {(onlyNoResults || queryFilter) && "com esses filtros"}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left">
                  <th className="px-4 py-3 text-gray-500 font-medium">
                    Data/hora
                  </th>
                  <th className="px-4 py-3 text-gray-500 font-medium">
                    Termo buscado
                  </th>
                  <th className="px-4 py-3 text-gray-500 font-medium text-right">
                    Rankings
                  </th>
                  <th className="px-4 py-3 text-gray-500 font-medium text-right">
                    Produtos
                  </th>
                  <th className="px-4 py-3 text-gray-500 font-medium text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const hadRanking = row.rankingsFound > 0;
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatDateTime(row.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        <Link
                          href={`/busca?q=${encodeURIComponent(row.query)}`}
                          target="_blank"
                          className="hover:text-blue-600 hover:underline"
                        >
                          {row.query}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 font-medium">
                        {row.rankingsFound}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {row.productsFound}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {hadRanking ? (
                          <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                            Tinha ranking
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                            Sem ranking
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </div>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildHref({ page: String(page - 1) })}
                className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ← Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildHref({ page: String(page + 1) })}
                className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Próxima →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDateTime(date: Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hour = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hour}:${min}`;
}
