"use client";

import { useState } from "react";
import { slugify } from "@/lib/utils";
import { InputField, TextareaField } from "./FormField";
import { GroupOffersManager, type GroupOffer } from "./GroupOffersManager";
import { SubmitButton } from "./SubmitButton";

interface Props {
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: {
    slug?: string;
    name?: string;
    inviteUrl?: string;
    description?: string;
    active?: boolean;
    headline?: string;
    subheadline?: string;
    ctaText?: string;
    benefits?: string;
    memberCount?: number | null;
    offers?: GroupOffer[];
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


      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900 border-b pb-3">Página de entrada</h2>
        <p className="text-xs text-gray-500 -mt-2">
          Tudo aqui é opcional. Em branco, a página usa um texto padrão montado a partir do nome do grupo.
        </p>

        <InputField
          label="Título principal"
          name="headline"
          defaultValue={defaultValues.headline ?? ""}
          placeholder="Ofertas de fitness todo dia no seu WhatsApp"
          hint="A primeira coisa que a pessoa lê. Fale do que ela recebe, não do grupo."
        />

        <TextareaField
          label="Subtítulo"
          name="subheadline"
          defaultValue={defaultValues.subheadline ?? ""}
          rows={2}
          placeholder="Entre no grupo e receba os melhores preços antes de todo mundo."
        />

        <InputField
          label="Texto do botão"
          name="ctaText"
          defaultValue={defaultValues.ctaText ?? ""}
          placeholder="ENTRAR NO GRUPO GRÁTIS"
        />

        <TextareaField
          label="Benefícios"
          name="benefits"
          defaultValue={defaultValues.benefits ?? ""}
          rows={5}
          placeholder={"Ofertas todo dia | Achadinhos direto no seu WhatsApp\nCupons da comunidade | Códigos que só quem está no grupo recebe"}
          hint="Um por linha, no formato Título | Descrição. Em branco, usa quatro benefícios padrão."
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Ofertas da página</label>
          <GroupOffersManager name="offers" defaultValue={defaultValues.offers ?? []} />
        </div>

        <InputField
          label="Número de membros"
          name="memberCount"
          type="number"
          min={0}
          defaultValue={defaultValues.memberCount ?? ""}
          hint="Só preencha com o número real. Em branco, a página não mostra contagem nenhuma."
        />
      </div>

      <SubmitButton />
    </form>
  );
}
