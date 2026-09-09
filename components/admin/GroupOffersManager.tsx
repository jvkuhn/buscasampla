"use client";

import { useRef, useState } from "react";
import { resizeForUpload } from "@/lib/resize-image";

export interface GroupOffer {
  url: string;
  title?: string;
  oldPrice?: string;
  newPrice?: string;
}

/**
 * Lista de ofertas da landing do grupo.
 *
 * O estado vive aqui e e serializado num input hidden, entao o form continua
 * sendo um form nativo com server action — sem precisar de action separada por
 * item nem de salvar o grupo antes de subir imagem.
 */
export function GroupOffersManager({ name, defaultValue }: { name: string; defaultValue: GroupOffer[] }) {
  const [offers, setOffers] = useState<GroupOffer[]>(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setError("");
    setUploading(true);

    // Uma por vez: o endpoint valida magic bytes e um lote grande em paralelo
    // costuma estourar o limite de corpo da requisicao na Vercel.
    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append("file", await resizeForUpload(file));
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          setError(`${file.name}: ${data.error || "erro no envio"}`);
          continue;
        }
        setOffers((prev) => [...prev, { url: data.url, title: "", oldPrice: "", newPrice: "" }]);
      } catch {
        setError(`${file.name}: erro de conexão`);
      }
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function update(i: number, campo: keyof GroupOffer, valor: string) {
    setOffers((prev) => prev.map((o, idx) => (idx === i ? { ...o, [campo]: valor } : o)));
  }

  function remove(i: number) {
    setOffers((prev) => prev.filter((_, idx) => idx !== i));
  }

  function move(i: number, delta: number) {
    setOffers((prev) => {
      const destino = i + delta;
      if (destino < 0 || destino >= prev.length) return prev;
      const copia = [...prev];
      [copia[i], copia[destino]] = [copia[destino], copia[i]];
      return copia;
    });
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={JSON.stringify(offers)} />

      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFiles}
          disabled={uploading}
          className="text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-blue-700 hover:file:bg-blue-100"
        />
        {uploading && <span className="text-xs text-gray-500">Enviando...</span>}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {offers.length === 0 && (
        <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-xs text-gray-500">
          Nenhuma oferta. Envie as fotos dos produtos que você posta no grupo — é o que
          prova, antes da pessoa entrar, que o grupo entrega.
        </p>
      )}

      {offers.map((o, i) => (
        <div key={o.url} className="flex gap-3 rounded-lg border border-gray-200 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={o.url} alt="" className="h-20 w-20 shrink-0 rounded-md border border-gray-200 object-contain" />

          <div className="grid flex-1 grid-cols-2 gap-2">
            <input
              value={o.title ?? ""}
              onChange={(e) => update(i, "title", e.target.value)}
              placeholder="Nome do produto"
              className="col-span-2 rounded-md border border-gray-300 px-2 py-1.5 text-xs"
            />
            <input
              value={o.oldPrice ?? ""}
              onChange={(e) => update(i, "oldPrice", e.target.value)}
              placeholder="De: 249,90"
              className="rounded-md border border-gray-300 px-2 py-1.5 text-xs"
            />
            <input
              value={o.newPrice ?? ""}
              onChange={(e) => update(i, "newPrice", e.target.value)}
              placeholder="Por: 79,90"
              className="rounded-md border border-gray-300 px-2 py-1.5 text-xs"
            />
          </div>

          <div className="flex flex-col justify-between text-xs">
            <div className="space-x-1">
              <button type="button" onClick={() => move(i, -1)} className="text-gray-400 hover:text-gray-700" aria-label="Mover para cima">↑</button>
              <button type="button" onClick={() => move(i, 1)} className="text-gray-400 hover:text-gray-700" aria-label="Mover para baixo">↓</button>
            </div>
            <button type="button" onClick={() => remove(i)} className="font-medium text-red-600 hover:text-red-800">
              Remover
            </button>
          </div>
        </div>
      ))}

      <p className="text-xs text-gray-500">
        Preço é opcional — sem ele o card mostra só a foto. Com “de” e “por”, a página calcula
        o percentual de desconto sozinha.
      </p>
    </div>
  );
}
