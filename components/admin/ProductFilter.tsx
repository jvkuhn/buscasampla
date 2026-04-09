"use client";

import { useRouter } from "next/navigation";

interface Props {
  categories: { id: string; name: string }[];
  selected?: string;
}

export function ProductFilter({ categories, selected }: Props) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3 mb-4">
      <label className="text-sm text-gray-600 shrink-0">Filtrar por categoria:</label>
      <select
        value={selected ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          router.push(val ? `/admin/produtos?categoria=${val}` : "/admin/produtos");
        }}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
      >
        <option value="">Todas</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
