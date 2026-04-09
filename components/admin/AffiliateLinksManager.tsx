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

const PLATFORM_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  mercadolivre: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Mercado Livre" },
  amazon: { bg: "bg-orange-100", text: "text-orange-700", label: "Amazon" },
  shopee: { bg: "bg-red-100", text: "text-red-700", label: "Shopee" },
  magalu: { bg: "bg-blue-100", text: "text-blue-700", label: "Magalu" },
  americanas: { bg: "bg-red-100", text: "text-red-700", label: "Americanas" },
  outro: { bg: "bg-gray-100", text: "text-gray-700", label: "Outro" },
};

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

  const mlLinks = links.filter((l) => l.platform === "mercadolivre");
  const otherLinks = links.filter((l) => l.platform !== "mercadolivre");

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <h2 className="text-sm font-semibold text-gray-900 border-b pb-3">
        Links de afiliado ({links.length})
      </h2>

      {/* Mercado Livre links - highlighted */}
      {mlLinks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-yellow-800 uppercase tracking-wide">Mercado Livre</h3>
          <ul className="divide-y divide-yellow-100 border border-yellow-200 rounded-lg bg-yellow-50/50">
            {mlLinks.map((l) => (
              <LinkRow key={l.id} link={l} productId={productId} startTransition={startTransition} />
            ))}
          </ul>
        </div>
      )}

      {/* Other platform links - compact */}
      {otherLinks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Outras plataformas</h3>
          <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
            {otherLinks.map((l) => (
              <LinkRow key={l.id} link={l} productId={productId} startTransition={startTransition} />
            ))}
          </ul>
        </div>
      )}

      {links.length === 0 && (
        <div className="border border-gray-100 rounded-lg p-6 text-center text-sm text-gray-400">
          Nenhum link cadastrado.
        </div>
      )}

      <form ref={formRef} action={handleAdd} className="space-y-3 pt-3 border-t border-gray-100">
        <div className="grid grid-cols-[160px_1fr] gap-3">
          <select
            name="platform"
            required
            defaultValue=""
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="" disabled>Plataforma</option>
            <option value="mercadolivre">Mercado Livre</option>
            <option value="amazon">Amazon</option>
            <option value="shopee">Shopee</option>
            <option value="magalu">Magalu</option>
            <option value="americanas">Americanas</option>
            <option value="outro">Outro</option>
          </select>
          <input
            name="url"
            type="url"
            required
            placeholder="https://..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <input
          name="label"
          placeholder="Rótulo (opcional — ex: 'Cor preta 128GB')"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
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

function LinkRow({
  link,
  productId,
  startTransition,
}: {
  link: Link;
  productId: string;
  startTransition: (cb: () => void) => void;
}) {
  const style = PLATFORM_STYLES[link.platform] ?? PLATFORM_STYLES.outro;

  return (
    <li className="flex items-center gap-3 p-3">
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
      >
        {style.label}
      </span>
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="flex-1 text-sm text-blue-600 hover:underline truncate"
      >
        {link.label || link.url}
      </a>
      <button
        type="button"
        onClick={() =>
          startTransition(() => {
            deleteAffiliateLink(link.id, productId).then(() => {});
          })
        }
        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
      >
        Remover
      </button>
    </li>
  );
}
