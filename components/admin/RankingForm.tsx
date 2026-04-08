"use client";

import { useState } from "react";
import { slugify } from "@/lib/utils";
import { InputField, TextareaField, SelectField } from "./FormField";

interface Props {
  action: (formData: FormData) => void | Promise<void>;
  categories: { id: string; name: string }[];
  defaultValues?: {
    title?: string;
    slug?: string;
    subtitle?: string;
    intro?: string;
    conclusion?: string;
    coverUrl?: string;
    metaTitle?: string;
    metaDesc?: string;
    ogTitle?: string;
    ogDesc?: string;
    ogImageUrl?: string;
    status?: string;
    categoryId?: string | null;
  };
}

export function RankingForm({ action, categories, defaultValues = {} }: Props) {
  const [title, setTitle] = useState(defaultValues.title ?? "");
  const [slug, setSlug] = useState(defaultValues.slug ?? "");
  const [slugManual, setSlugManual] = useState(!!defaultValues.slug);

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setTitle(val);
    if (!slugManual) setSlug(slugify(val));
  }

  return (
    <form action={action} className="space-y-6 max-w-3xl">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900 border-b pb-3">Informações</h2>

        <InputField label="Título *" name="title" value={title} onChange={handleTitleChange} required />
        <InputField
          label="Slug *"
          name="slug"
          value={slug}
          onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
          required
        />
        <InputField label="Subtítulo" name="subtitle" defaultValue={defaultValues.subtitle ?? ""} />
        <TextareaField
          label="Introdução"
          name="intro"
          defaultValue={defaultValues.intro ?? ""}
          rows={4}
        />
        <TextareaField
          label="Conclusão"
          name="conclusion"
          defaultValue={defaultValues.conclusion ?? ""}
          rows={4}
        />
        <InputField
          label="URL da imagem de capa"
          name="coverUrl"
          type="url"
          defaultValue={defaultValues.coverUrl ?? ""}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900 border-b pb-3">SEO & Social</h2>

        <InputField
          label="Meta título"
          name="metaTitle"
          defaultValue={defaultValues.metaTitle ?? ""}
          maxLength={70}
        />
        <TextareaField
          label="Meta descrição"
          name="metaDesc"
          defaultValue={defaultValues.metaDesc ?? ""}
          rows={2}
          maxLength={160}
        />
        <InputField
          label="OG título"
          name="ogTitle"
          defaultValue={defaultValues.ogTitle ?? ""}
          maxLength={70}
        />
        <TextareaField
          label="OG descrição"
          name="ogDesc"
          defaultValue={defaultValues.ogDesc ?? ""}
          rows={2}
          maxLength={200}
        />
        <InputField
          label="OG imagem (URL)"
          name="ogImageUrl"
          type="url"
          defaultValue={defaultValues.ogImageUrl ?? ""}
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
          href="/admin/rankings"
          className="px-6 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
