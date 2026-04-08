"use client";

import { useState } from "react";
import { slugify } from "@/lib/utils";
import { InputField, TextareaField, SelectField } from "./FormField";

interface Props {
  action: (formData: FormData) => Promise<unknown>;
  defaultValues?: {
    name?: string;
    slug?: string;
    description?: string;
    imageUrl?: string;
    metaTitle?: string;
    metaDesc?: string;
    status?: string;
    order?: number;
  };
}

export function CategoryForm({ action, defaultValues = {} }: Props) {
  const [name, setName] = useState(defaultValues.name ?? "");
  const [slug, setSlug] = useState(defaultValues.slug ?? "");
  const [slugManual, setSlugManual] = useState(!!defaultValues.slug);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setName(val);
    if (!slugManual) setSlug(slugify(val));
  }

  return (
    <form action={action} className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900 border-b pb-3">Informações</h2>

        <InputField
          label="Nome *"
          name="name"
          value={name}
          onChange={handleNameChange}
          required
        />

        <InputField
          label="Slug *"
          name="slug"
          value={slug}
          onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
          hint="Gerado automaticamente a partir do nome. Edite manualmente se necessário."
          required
        />

        <TextareaField
          label="Descrição"
          name="description"
          defaultValue={defaultValues.description ?? ""}
          rows={3}
        />

        <InputField
          label="URL da imagem"
          name="imageUrl"
          type="url"
          defaultValue={defaultValues.imageUrl ?? ""}
          placeholder="https://..."
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900 border-b pb-3">SEO</h2>

        <InputField
          label="Meta título"
          name="metaTitle"
          defaultValue={defaultValues.metaTitle ?? ""}
          maxLength={70}
          placeholder="Até 70 caracteres"
        />

        <TextareaField
          label="Meta descrição"
          name="metaDesc"
          defaultValue={defaultValues.metaDesc ?? ""}
          rows={2}
          maxLength={160}
          placeholder="Até 160 caracteres"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900 border-b pb-3">Configurações</h2>

        <SelectField
          label="Status"
          name="status"
          defaultValue={defaultValues.status ?? "DRAFT"}
          options={[
            { value: "DRAFT", label: "Rascunho" },
            { value: "PUBLISHED", label: "Publicado" },
          ]}
        />

        <InputField
          label="Ordem"
          name="order"
          type="number"
          defaultValue={String(defaultValues.order ?? 0)}
          min={0}
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
          href="/admin/categorias"
          className="px-6 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
