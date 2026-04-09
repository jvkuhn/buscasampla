"use client";

import { useState } from "react";
import { updateRankingAfiliados, type AfiliadoItem } from "@/lib/actions/afiliados";

type AffiliateLink = {
  id: string;
  platform: string;
  url: string;
};

type Product = {
  id: string;
  name: string;
  affiliateLinks: AffiliateLink[];
};

type RankingItem = {
  id: string;
  order: number;
  product: Product;
};

type Ranking = {
  id: string;
  title: string;
  items: RankingItem[];
};

export function AfiliadosManager({ rankings }: { rankings: Ranking[] }) {
  const [fields, setFields] = useState<
    Record<string, { mercadoLivreUrl: string; imageUrl: string }>
  >({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savedRankings, setSavedRankings] = useState<Record<string, boolean>>({});

  function setField(
    productId: string,
    key: "mercadoLivreUrl" | "imageUrl",
    value: string
  ) {
    setFields((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [key]: value },
    }));
  }

  async function handleSave(rankingId: string, items: RankingItem[]) {
    setSaving(rankingId);
    const payload: AfiliadoItem[] = items
      .map((item) => ({
        productId: item.product.id,
        mercadoLivreUrl: fields[item.product.id]?.mercadoLivreUrl || undefined,
        imageUrl: fields[item.product.id]?.imageUrl || undefined,
      }))
      .filter((i) => i.mercadoLivreUrl || i.imageUrl);

    if (payload.length === 0) {
      setSaving(null);
      return;
    }

    try {
      await updateRankingAfiliados(payload);
      setSavedRankings((prev) => ({ ...prev, [rankingId]: true }));
    } catch (err) {
      alert("Erro ao salvar: " + err);
    } finally {
      setSaving(null);
    }
  }

  if (rankings.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-500 text-sm">
          Nenhum ranking DRAFT com links pendentes.
        </p>
        <p className="text-gray-400 text-xs mt-2">
          Adicione tópicos em{" "}
          <code className="bg-gray-100 px-1 rounded">scripts/fila-top10.txt</code> e rode{" "}
          <code className="bg-gray-100 px-1 rounded">npm run gerar-top10</code>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {rankings.map((ranking) => (
        <div
          key={ranking.id}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                DRAFT
              </span>
              <span className="font-semibold text-gray-900">{ranking.title}</span>
              <span className="text-xs text-gray-400">
                ({ranking.items.length} produtos)
              </span>
            </div>
            <button
              onClick={() => handleSave(ranking.id, ranking.items)}
              disabled={saving === ranking.id}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving === ranking.id
                ? "Salvando..."
                : savedRankings[ranking.id]
                ? "✓ Salvo"
                : "Salvar ranking"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 w-8">#</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Produto</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Link ML gerado</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Link Afiliado</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Imagem URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ranking.items.map((item) => {
                  const mlLink = item.product.affiliateLinks.find(
                    (l) => l.platform === "mercadolivre"
                  );
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-400 text-xs">{item.order}</td>
                      <td className="px-3 py-2 font-medium text-gray-900 max-w-[160px]">
                        <span className="truncate block">{item.product.name}</span>
                      </td>
                      <td className="px-3 py-2">
                        {mlLink ? (
                          <a
                            href={mlLink.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs font-mono truncate block max-w-[180px]"
                            title={mlLink.url}
                          >
                            {mlLink.url.replace("https://lista.mercadolivre.com.br/", "ml://")} ↗
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="url"
                          placeholder="https://mercadolivre.com/..."
                          value={fields[item.product.id]?.mercadoLivreUrl ?? ""}
                          onChange={(e) =>
                            setField(item.product.id, "mercadoLivreUrl", e.target.value)
                          }
                          className="w-full min-w-[200px] text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="url"
                          placeholder="https://..."
                          value={fields[item.product.id]?.imageUrl ?? ""}
                          onChange={(e) =>
                            setField(item.product.id, "imageUrl", e.target.value)
                          }
                          className="w-full min-w-[180px] text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
