"use client";

import { useState, useTransition } from "react";
import {
  addRankingItem,
  removeRankingItem,
  reorderRankingItems,
} from "@/lib/actions/rankings";

interface Item {
  id: string;
  order: number;
  product: { id: string; name: string; imageUrl: string | null };
}

interface Props {
  rankingId: string;
  items: Item[];
  products: { id: string; name: string }[];
}

export function RankingItemsManager({ rankingId, items: initial, products }: Props) {
  const [items, setItems] = useState(initial);
  const [selected, setSelected] = useState("");
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
        {items.map((item, idx) => (
          <li key={item.id} className="flex items-center gap-3 p-3">
            <span className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
              {item.order}
            </span>
            {item.product.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.product.imageUrl}
                alt=""
                className="w-10 h-10 object-cover rounded border border-gray-200"
              />
            )}
            <span className="flex-1 text-sm text-gray-900">{item.product.name}</span>
            <div className="flex items-center gap-1">
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
          </li>
        ))}
        {items.length === 0 && (
          <li className="p-6 text-center text-sm text-gray-400">
            Nenhum produto no ranking ainda.
          </li>
        )}
      </ul>
    </div>
  );
}
