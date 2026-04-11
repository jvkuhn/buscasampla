"use client";

import { useState } from "react";
import { updateProductConfig, updateProductName, type ProductConfigItem } from "@/lib/actions/afiliados";

type AffiliateLink = {
  id: string;
  platform: string;
  url: string;
};

type Product = {
  id: string;
  name: string;
  imageUrl: string | null;
  categoryId: string | null;
  badge: string | null;
  affiliateLinks: AffiliateLink[];
  category: { name: string } | null;
  rankingItems: {
    ranking: { id: string; title: string; slug: string };
  }[];
};

type Category = {
  id: string;
  name: string;
};

type FieldValues = {
  mercadoLivreUrl: string;
  imageUrl: string;
  categoryId: string;
  badge: string;
};

function getRequiredCount(product: Product, fields: FieldValues | undefined): { filled: number; total: number } {
  const total = 3; // imageUrl, ML link real, categoryId
  let filled = 0;

  const hasImage = (fields?.imageUrl || product.imageUrl) && (fields?.imageUrl || product.imageUrl) !== "";
  if (hasImage) filled++;

  const mlLink = product.affiliateLinks.find((l) => l.platform === "mercadolivre");
  const mlIsSearch = mlLink?.url.includes("lista.mercadolivre.com.br");
  const hasRealMl = fields?.mercadoLivreUrl ? true : (mlLink && !mlIsSearch);
  if (hasRealMl) filled++;

  const hasCat = fields?.categoryId || product.categoryId;
  if (hasCat) filled++;

  return { filled, total };
}

export function ConfigurarProdutosManager({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const [fields, setFields] = useState<Record<string, FieldValues>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [editingName, setEditingName] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);

  function startEditName(productId: string, currentName: string) {
    setEditingName(productId);
    setNameDraft(currentName);
  }

  function cancelEditName() {
    setEditingName(null);
    setNameDraft("");
  }

  async function saveEditName(productId: string) {
    const trimmed = nameDraft.trim();
    if (!trimmed) return;
    setSavingName(true);
    try {
      await updateProductName({ productId, name: trimmed });
      setProductNames((prev) => ({ ...prev, [productId]: trimmed }));
      setEditingName(null);
      setNameDraft("");
    } catch (err) {
      alert("Erro ao salvar nome: " + err);
    } finally {
      setSavingName(false);
    }
  }

  function setField(productId: string, key: keyof FieldValues, value: string) {
    setFields((prev) => {
      const existing = prev[productId] ?? {
        mercadoLivreUrl: "",
        imageUrl: "",
        categoryId: "",
        badge: "",
      };
      return {
        ...prev,
        [productId]: { ...existing, [key]: value },
      };
    });
  }

  async function handleSaveAll() {
    setSaving(true);
    const payload: ProductConfigItem[] = [];

    for (const product of products) {
      const f = fields[product.id];
      if (!f) continue;

      const hasChanges =
        f.mercadoLivreUrl || f.imageUrl || f.categoryId || f.badge;
      if (!hasChanges) continue;

      payload.push({
        productId: product.id,
        mercadoLivreUrl: f.mercadoLivreUrl || undefined,
        imageUrl: f.imageUrl || undefined,
        categoryId: f.categoryId || undefined,
        badge: (f.badge || undefined) as ProductConfigItem["badge"],
      });
    }

    if (payload.length === 0) {
      setSaving(false);
      return;
    }

    try {
      await updateProductConfig(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Erro ao salvar: " + err);
    } finally {
      setSaving(false);
    }
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-500 text-sm">
          Todos os produtos estao configurados!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <span className="text-sm text-gray-500">
          {products.length} produto{products.length !== 1 ? "s" : ""} pendente{products.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar todos"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500 w-8">#</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 w-[25%]">Produto</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Categoria</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Link ML</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Imagem URL</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 w-[150px]">Selo</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 w-20">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product, idx) => {
              const mlLink = product.affiliateLinks.find((l) => l.platform === "mercadolivre");
              const f = fields[product.id];
              const { filled, total } = getRequiredCount(product, f);
              const allFilled = filled === total;

              return (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="px-3 py-2 font-medium text-gray-900">
                    {editingName === product.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={nameDraft}
                          onChange={(e) => setNameDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditName(product.id);
                            if (e.key === "Escape") cancelEditName();
                          }}
                          autoFocus
                          disabled={savingName}
                          className="flex-1 min-w-0 text-sm border border-blue-400 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => saveEditName(product.id)}
                          disabled={savingName || !nameDraft.trim()}
                          className="text-green-600 hover:text-green-700 disabled:opacity-40 p-1"
                          title="Salvar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                        <button
                          onClick={cancelEditName}
                          disabled={savingName}
                          className="text-gray-500 hover:text-gray-700 disabled:opacity-40 p-1"
                          title="Cancelar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-1.5 group">
                        <span className="block flex-1">{productNames[product.id] ?? product.name}</span>
                        <button
                          onClick={() => startEditName(product.id, productNames[product.id] ?? product.name)}
                          className="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 flex-shrink-0 mt-0.5"
                          title="Editar nome"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          </svg>
                        </button>
                      </div>
                    )}
                    {product.rankingItems.length > 0 && (
                      <span className="block text-[11px] text-gray-500 font-normal mt-0.5 leading-tight">
                        {product.rankingItems.map((ri, i) => (
                          <span key={ri.ranking.id}>
                            {i > 0 && <span className="text-gray-300"> · </span>}
                            <a
                              href={`/ranking/${ri.ranking.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-blue-600 hover:underline"
                              title={ri.ranking.title}
                            >
                              {ri.ranking.title}
                            </a>
                          </span>
                        ))}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={f?.categoryId || product.categoryId || ""}
                      onChange={(e) => setField(product.id, "categoryId", e.target.value)}
                      className="w-full min-w-[140px] text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Selecione...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    {mlLink && (
                      <a
                        href={mlLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs font-mono truncate block max-w-[160px] mb-1"
                        title={mlLink.url}
                      >
                        {mlLink.url.includes("lista.mercadolivre.com.br")
                          ? mlLink.url.replace("https://lista.mercadolivre.com.br/", "ml://")
                          : mlLink.url.replace(/https?:\/\//, "").slice(0, 30)
                        }
                      </a>
                    )}
                    <input
                      type="url"
                      placeholder="https://mercadolivre.com/..."
                      value={f?.mercadoLivreUrl ?? ""}
                      onChange={(e) => setField(product.id, "mercadoLivreUrl", e.target.value)}
                      className="w-full min-w-[180px] text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt=""
                          className="w-6 h-6 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <input
                        type="url"
                        placeholder="https://..."
                        value={f?.imageUrl ?? ""}
                        onChange={(e) => setField(product.id, "imageUrl", e.target.value)}
                        className="w-full min-w-[160px] text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={f?.badge || product.badge || ""}
                      onChange={(e) => setField(product.id, "badge", e.target.value)}
                      className="w-full min-w-[140px] text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">— Nenhum —</option>
                      <option value="MELHOR_ESCOLHA">Melhor Escolha</option>
                      <option value="CUSTO_BENEFICIO">Melhor Custo-Benefício</option>
                      <option value="MAIS_VENDIDO">Mais Vendido</option>
                      <option value="PREMIUM">Premium</option>
                      <option value="RECOMENDADO">Recomendado</option>
                      <option value="BOM_E_BARATO">Bom e Barato</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span
                        className={`inline-block w-2.5 h-2.5 rounded-full ${
                          allFilled ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <span className="text-xs text-gray-400">{filled}/{total}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
