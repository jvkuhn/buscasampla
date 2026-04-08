"use client";

import { useState } from "react";
import { slugify } from "@/lib/utils";
import { InputField, TextareaField, SelectField } from "./FormField";

interface Props {
  action: (formData: FormData) => Promise<unknown>;
  categories: { id: string; name: string }[];
  defaultValues?: {
    name?: string;
    slug?: string;
    shortDesc?: string;
    longDesc?: string;
    imageUrl?: string;
    gallery?: string[];
    currentPrice?: number | null;
    oldPrice?: number | null;
    priceRange?: string;
    rating?: number | null;
    pros?: string[];
    cons?: string[];
    brand?: string;
    badge?: string | null;
    status?: string;
    categoryId?: string | null;
  };
}

export function ProductForm({ action, categories, defaultValues = {} }: Props) {
  const [name, setName] = useState(defaultValues.name ?? "");
  const [slug, setSlug] = useState(defaultValues.slug ?? "");
  const [slugManual, setSlugManual] = useState(!!defaultValues.slug);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setName(val);
    if (!slugManual) setSlug(slugify(val));
  }

  return (
    <form action={action} className="space-y-6 max-w-3xl">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900 border-b pb-3">Informações</h2>

        <InputField label="Nome *" name="name" value={name} onChange={handleNameChange} required />

        <InputField
          label="Slug *"
          name="slug"
          value={slug}
          onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
          required
        />

        <InputField label="Marca" name="brand" defaultValue={defaultValues.brand ?? ""} />

        <TextareaField
          label="Descrição curta"
          name="shortDesc"
          defaultValue={defaultValues.shortDesc ?? ""}
          rows={2}
          maxLength={300}
        />

        <TextareaField
          label="Descrição longa"
          name="longDesc"
          defaultValue={defaultValues.longDesc ?? ""}
          rows={6}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900 border-b pb-3">Mídia</h2>

        <InputField
          label="URL da imagem principal"
          name="imageUrl"
          type="url"
          defaultValue={defaultValues.imageUrl ?? ""}
          placeholder="https://..."
        />

        <TextareaField
          label="Galeria (uma URL por linha)"
          name="gallery"
          defaultValue={(defaultValues.gallery ?? []).join("\n")}
          rows={3}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900 border-b pb-3">Preço & Avaliação</h2>

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Preço atual"
            name="currentPrice"
            type="number"
            step="0.01"
            defaultValue={defaultValues.currentPrice != null ? String(defaultValues.currentPrice) : ""}
          />
          <InputField
            label="Preço antigo"
            name="oldPrice"
            type="number"
            step="0.01"
            defaultValue={defaultValues.oldPrice != null ? String(defaultValues.oldPrice) : ""}
          />
        </div>

        <InputField
          label="Faixa de preço (texto)"
          name="priceRange"
          defaultValue={defaultValues.priceRange ?? ""}
          placeholder="Ex: R$ 200 - R$ 500"
        />

        <InputField
          label="Nota (0 a 5)"
          name="rating"
          type="number"
          step="0.1"
          min={0}
          max={5}
          defaultValue={defaultValues.rating != null ? String(defaultValues.rating) : ""}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900 border-b pb-3">Prós & Contras</h2>

        <TextareaField
          label="Prós (um por linha)"
          name="pros"
          defaultValue={(defaultValues.pros ?? []).join("\n")}
          rows={4}
        />

        <TextareaField
          label="Contras (um por linha)"
          name="cons"
          defaultValue={(defaultValues.cons ?? []).join("\n")}
          rows={4}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900 border-b pb-3">Configurações</h2>

        <SelectField
          label="Categoria"
          name="categoryId"
          defaultValue={defaultValues.categoryId ?? ""}
          options={[
            { value: "", label: "— Nenhuma —" },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />

        <SelectField
          label="Selo"
          name="badge"
          defaultValue={defaultValues.badge ?? ""}
          options={[
            { value: "", label: "— Nenhum —" },
            { value: "BEST_VALUE", label: "Melhor custo-benefício" },
            { value: "BEST_SELLER", label: "Mais vendido" },
            { value: "PREMIUM", label: "Premium" },
            { value: "CHEAPEST", label: "Mais barato" },
          ]}
        />

        <SelectField
          label="Status"
          name="status"
          defaultValue={defaultValues.status ?? "DRAFT"}
          options={[
            { value: "DRAFT", label: "Rascunho" },
            { value: "PUBLISHED", label: "Publicado" },
          ]}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Salvar
        </button>
        <a
          href="/admin/produtos"
          className="px-6 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
