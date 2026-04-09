"use client";

import { useState, useTransition } from "react";
import { cleanupRankingsAndProducts } from "@/lib/actions/cleanup";

export function CleanupButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    startTransition(async () => {
      try {
        const r = await cleanupRankingsAndProducts();
        setResult(
          `Removidos: ${r.rankings} rankings, ${r.products} produtos, ${r.faqs} FAQs, ${r.affiliateLinks} links`
        );
        setConfirming(false);
      } catch (err) {
        setResult("Erro: " + (err instanceof Error ? err.message : "desconhecido"));
        setConfirming(false);
      }
    });
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={pending}
        className={`flex items-center justify-center py-3 px-4 rounded-lg border text-sm font-medium transition-colors w-full ${
          confirming
            ? "border-red-400 bg-red-50 text-red-700 hover:bg-red-100"
            : "border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-red-300"
        } disabled:opacity-50`}
      >
        {pending
          ? "Limpando..."
          : confirming
          ? "Confirmar limpeza?"
          : "Limpar rankings e produtos"}
      </button>
      {result && (
        <p className="text-xs text-gray-500 mt-2 text-center">{result}</p>
      )}
    </div>
  );
}
