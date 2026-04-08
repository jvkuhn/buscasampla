"use client";

import { useRef, useTransition } from "react";
import { upsertAffiliateLink, deleteAffiliateLink } from "@/lib/actions/products";

interface Link {
  id: string;
  platform: string;
  url: string;
  label: string | null;
}

interface Props {
  productId: string;
  links: Link[];
}

export function AffiliateLinksManager({ productId, links }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();

  async function handleAdd(formData: FormData) {
    await upsertAffiliateLink(productId, {
      platform: String(formData.get("platform") ?? ""),
      url: String(formData.get("url") ?? ""),
      label: String(formData.get("label") ?? ""),
    });
    formRef.current?.reset();
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <h2 className="text-sm font-semibold text-gray-900 border-b pb-3">
        Links de afiliado ({links.length})
      </h2>

      <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
        {links.map((l) => (
          <li key={l.id} className="flex items-center gap-3 p-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-700 uppercase">
              {l.platform}
            </span>
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex-1 text-sm text-blue-600 hover:underline truncate"
            >
              {l.label || l.url}
            </a>
            <button
              type="button"
              onClick={() =>
                startTransition(() => deleteAffiliateLink(l.id, productId).then(() => {}))
              }
              className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
            >
              Remover
            </button>
          </li>
        ))}
        {links.length === 0 && (
          <li className="p-6 text-center text-sm text-gray-400">Nenhum link cadastrado.</li>
        )}
      </ul>

      <form ref={formRef} action={handleAdd} className="space-y-3 pt-3 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-3">
          <select
            name="platform"
            required
            defaultValue=""
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="" disabled>Plataforma</option>
            <option value="amazon">Amazon</option>
            <option value="mercadolivre">Mercado Livre</option>
            <option value="shopee">Shopee</option>
            <option value="magalu">Magalu</option>
            <option value="americanas">Americanas</option>
            <option value="outro">Outro</option>
          </select>
          <input
            name="label"
            placeholder="Rótulo (opcional)"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            name="url"
            type="url"
            required
            placeholder="https://..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Adicionar link
        </button>
      </form>
    </div>
  );
}
