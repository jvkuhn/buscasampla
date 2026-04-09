"use client";

import { useState, useTransition } from "react";
import {
  addRankingItem,
  removeRankingItem,
  reorderRankingItems,
} from "@/lib/actions/rankings";
import { quickUpdateProductMedia } from "@/lib/actions/products";

interface AffiliateLink {
  id: string;
  platform: string;
  url: string;
}

interface Item {
  id: string;
  order: number;
  product: {
    id: string;
    name: string;
    imageUrl: string | null;
    affiliateLinks: AffiliateLink[];
  };
}

interface Props {
  rankingId: string;
  items: Item[];
  products: { id: string; name: string }[];
}

function getLink(links: AffiliateLink[], platform: string) {
  return links.find((l) => l.platform === platform)?.url ?? "";
}

export function RankingItemsManager({ rankingId, items: initial, products }: Props) {
  const [items, setItems] = useState(initial);
  const [selected, setSelected] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, { imageUrl: string; amazon: string; mercadolivre: string; shopee: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const available = products.filter((p) => !items.some((i) => i.product.id === p.id));

  function handleAdd() {
    if (!selected) return;
    startTransition(async () => {
      await addRankingItem(rankingId, selected);
      setSelected("");
    });
  }

  function handleRemove(itemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    startTransition(async () => {
      await removeRankingItem(itemId, rankingId);
    });
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    const reordered = next.map((it, idx) => ({ ...it, order: idx + 1 }));
    setItems(reordered);
    startTransition(async () => {
      await reorderRankingItems(
        rankingId,
        reordered.map((it) => ({ id: it.id, order: it.order }))
      );
    });
  }

  function toggleExpand(item: Item) {
    if (expandedId === item.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(item.id);
    // Pre-fill with current values
    setEditValues((prev) => ({
      ...prev,
      [item.id]: {
        imageUrl: item.product.imageUrl ?? "",
        amazon: getLink(item.product.affiliateLinks, "amazon"),
        mercadolivre: getLink(item.product.affiliateLinks, "mercadolivre"),
        shopee: getLink(item.product.affiliateLinks, "shopee"),
      },
    }));
  }

  function updateField(itemId: string, field: string, value: string) {
    setEditValues((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  }

  async function handleSave(item: Item) {
    const vals = editValues[item.id];
    if (!vals) return;
    setSaving(item.id);
    await quickUpdateProductMedia(item.product.id, rankingId, vals);
    // Update local state to reflect new imageUrl
    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id
          ? { ...it, product: { ...it.product, imageUrl: vals.imageUrl || null } }
          : it
      )
    );
    setSaving(null);
    setExpandedId(null);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <h2 className="text-sm font-semibold text-gray-900 border-b pb-3">
        Itens do ranking ({items.length})
      </h2>

      <div className="flex gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">— Selecione um produto —</option>
          {available.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!selected}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
        >
          Adicionar
        </button>
      </div>

      <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
        {items.map((item, idx) => {
          const isExpanded = expandedId === item.id;
          const vals = editValues[item.id];
          const isSaving = saving === item.id;

          return (
            <li key={item.id}>
              {/* Linha principal */}
              <div className="flex items-center gap-3 p-3">
                <span className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700 shrink-0">
                  {item.order}
                </span>
                {item.product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product.imageUrl}
                    alt=""
                    className="w-10 h-10 object-cover rounded border border-gray-200 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded border border-dashed border-gray-300 bg-gray-50 shrink-0 flex items-center justify-center">
                    <span className="text-gray-300 text-xs">img</span>
                  </div>
                )}
                <span className="flex-1 text-sm text-gray-900 truncate">{item.product.name}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleExpand(item)}
                    className={`px-2 py-1 text-xs rounded font-medium ${
                      isExpanded
                        ? "bg-blue-100 text-blue-700"
                        : "text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    {isExpanded ? "Fechar" : "Editar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(idx, 1)}
                    disabled={idx === items.length - 1}
                    className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                  >
                    Remover
                  </button>
                </div>
              </div>

              {/* Painel de edição rápida */}
              {isExpanded && vals && (
                <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100 space-y-3">
                  <p className="text-xs text-gray-500 pt-3 font-medium">Edição rápida — imagem e links</p>
                  <div className="space-y-2">
                    <label className="block text-xs text-gray-600">URL da imagem</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="url"
                        value={vals.imageUrl}
                        onChange={(e) => updateField(item.id, "imageUrl", e.target.value)}
                        placeholder="https://..."
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                      />
                      {vals.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={vals.imageUrl}
                          alt="preview"
                          className="w-10 h-10 object-cover rounded border border-gray-200"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {(["amazon", "mercadolivre", "shopee"] as const).map((platform) => (
                      <div key={platform}>
                        <label className="block text-xs text-gray-600 mb-1 capitalize">
                          {platform === "mercadolivre" ? "Mercado Livre" : platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </label>
                        <input
                          type="url"
                          value={vals[platform]}
                          onChange={(e) => updateField(item.id, platform, e.target.value)}
                          placeholder="https://..."
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSave(item)}
                      disabled={isSaving}
                      className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSaving ? "Salvando…" : "Salvar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedId(null)}
                      className="px-4 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-200"
                    >
                      Cancelar
                    </button>
                    <a
                      href={`/admin/produtos/${item.product.id}`}
                      className="ml-auto px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-700 hover:underline"
                    >
                      Edição completa →
                    </a>
                  </div>
                </div>
              )}
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="p-6 text-center text-sm text-gray-400">
            Nenhum produto no ranking ainda.
          </li>
        )}
      </ul>
    </div>
  );
}
