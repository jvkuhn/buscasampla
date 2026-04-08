"use client";

import { useRef, useTransition } from "react";
import { createFAQ, deleteFAQ } from "@/lib/actions/rankings";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
}

interface Props {
  rankingId: string;
  faqs: FAQ[];
}

export function FAQManager({ rankingId, faqs }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    await createFAQ(rankingId, formData);
    formRef.current?.reset();
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <h2 className="text-sm font-semibold text-gray-900 border-b pb-3">
        Perguntas frequentes ({faqs.length})
      </h2>

      <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
        {faqs.map((f) => (
          <li key={f.id} className="p-3 flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{f.question}</p>
              <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{f.answer}</p>
            </div>
            <button
              type="button"
              onClick={() => startTransition(() => deleteFAQ(f.id, rankingId).then(() => {}))}
              className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
            >
              Remover
            </button>
          </li>
        ))}
        {faqs.length === 0 && (
          <li className="p-6 text-center text-sm text-gray-400">Nenhuma FAQ cadastrada.</li>
        )}
      </ul>

      <form ref={formRef} action={handleSubmit} className="space-y-3 pt-3 border-t border-gray-100">
        <input
          name="question"
          required
          placeholder="Pergunta"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <textarea
          name="answer"
          required
          rows={3}
          placeholder="Resposta"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-3">
          <input
            name="order"
            type="number"
            min={0}
            defaultValue={faqs.length}
            className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Adicionar FAQ
          </button>
        </div>
      </form>
    </div>
  );
}
