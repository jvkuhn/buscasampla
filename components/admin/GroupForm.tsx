"use client";

import { useState } from "react";
import { slugify } from "@/lib/utils";
import { InputField, TextareaField } from "./FormField";
import { SubmitButton } from "./SubmitButton";

interface Props {
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: {
    slug?: string;
    name?: string;
    inviteUrl?: string;
    description?: string;
    active?: boolean;
  };
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export function GroupForm({ action, defaultValues = {} }: Props) {
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
        <h2 className="text-sm font-semibold text-gray-900 border-b pb-3">Grupo</h2>

        <InputField
          label="Nome *"
          name="name"
          value={name}
          onChange={handleNameChange}
          placeholder="Fitness"
          required
        />

        <InputField
          label="Slug *"
          name="slug"
          value={slug}
          onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
          hint={slug ? `O anúncio vai apontar para ${SITE}/${slug}` : "Vira o endereço da página de entrada."}
          required
        />

        <InputField
          label="Link de convite do grupo *"
          name="inviteUrl"
          type="url"
          defaultValue={defaultValues.inviteUrl ?? ""}
          placeholder="https://chat.whatsapp.com/..."
          hint="No WhatsApp: abra o grupo → Convidar via link → Copiar link. Ao lotar, troque aqui — o anúncio não precisa ser mexido."
          required
        />

        <TextareaField
          label="Descrição"
          name="description"
          defaultValue={defaultValues.description ?? ""}
          rows={2}
          hint="Uso interno e meta description da página. Opcional."
        />

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="active"
            defaultChecked={defaultValues.active ?? true}
            className="rounded border-gray-300"
          />
          Ativo
          <span className="text-xs text-gray-500">
            (desmarcado, a página responde 404 — use quando pausar a campanha)
          </span>
        </label>
      </div>

      <SubmitButton />
    </form>
  );
}
