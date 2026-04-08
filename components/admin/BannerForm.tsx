"use client";

import { InputField, TextareaField, SelectField } from "./FormField";

interface Props {
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: {
    title?: string;
    subtitle?: string;
    imageUrl?: string;
    linkUrl?: string;
    linkLabel?: string;
    position?: string;
    active?: boolean;
    order?: number;
  };
}

export function BannerForm({ action, defaultValues = {} }: Props) {
  return (
    <form action={action} className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <InputField label="Título *" name="title" defaultValue={defaultValues.title ?? ""} required />
        <TextareaField
          label="Subtítulo"
          name="subtitle"
          defaultValue={defaultValues.subtitle ?? ""}
          rows={2}
        />
        <InputField
          label="URL da imagem"
          name="imageUrl"
          type="url"
          defaultValue={defaultValues.imageUrl ?? ""}
        />
        <InputField
          label="URL do link"
          name="linkUrl"
          type="url"
          defaultValue={defaultValues.linkUrl ?? ""}
        />
        <InputField
          label="Rótulo do botão"
          name="linkLabel"
          defaultValue={defaultValues.linkLabel ?? ""}
        />
        <SelectField
          label="Posição"
          name="position"
          defaultValue={defaultValues.position ?? "home_top"}
          options={[
            { value: "home_top", label: "Home — topo" },
            { value: "home_mid", label: "Home — meio" },
            { value: "sidebar", label: "Sidebar" },
          ]}
        />
        <InputField
          label="Ordem"
          name="order"
          type="number"
          defaultValue={String(defaultValues.order ?? 0)}
          min={0}
        />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="active"
            defaultChecked={defaultValues.active ?? true}
            className="w-4 h-4"
          />
          Ativo
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Salvar
        </button>
        <a
          href="/admin/banners"
          className="px-6 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
