"use client";

import { useState } from "react";
import { slugify } from "@/lib/utils";
import { InputField, TextareaField, SelectField } from "./FormField";
import { SubmitButton } from "./SubmitButton";

interface Props {
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: {
    title?: string;
    slug?: string;
    content?: string;
    metaTitle?: string;
    metaDesc?: string;
    status?: string;
  };
}

export function SitePageForm({ action, defaultValues = {} }: Props) {
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
        <InputField label="Título *" name="title" value={title} onChange={handleTitleChange} required />
        <InputField
          label="Slug *"
          name="slug"
          value={slug}
          onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
          required
        />
        <TextareaField
          label="Conteúdo (Markdown ou HTML) *"
          name="content"
          defaultValue={defaultValues.content ?? ""}
          rows={16}
          required
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900 border-b pb-3">SEO</h2>
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
        <SubmitButton />
        <a
          href="/admin/paginas"
          className="px-6 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
