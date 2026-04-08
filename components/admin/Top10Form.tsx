"use client";

import { useState, useTransition } from "react";
import { createTop10Ranking } from "@/lib/actions/top10";
import type { Top10Input } from "@/lib/validations";

interface Props {
  categories: { id: string; name: string }[];
}

type ProductBlock = {
  name: string;
  brand: string;
  shortDesc: string;
  longDesc: string;
  imageUrl: string;
  currentPrice: string;
  oldPrice: string;
  rating: string;
  pros: string;
  cons: string;
  badge: string;
  amazonUrl: string;
  mercadoLivreUrl: string;
  shopeeUrl: string;
};

const EMPTY_PRODUCT: ProductBlock = {
  name: "", brand: "", shortDesc: "", longDesc: "", imageUrl: "",
  currentPrice: "", oldPrice: "", rating: "", pros: "", cons: "",
  badge: "", amazonUrl: "", mercadoLivreUrl: "", shopeeUrl: "",
};

const PRODUCT_COUNT = 10;

export function Top10Form({ categories }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Ranking
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [intro, setIntro] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // Produtos
  const [products, setProducts] = useState<ProductBlock[]>(
    Array.from({ length: PRODUCT_COUNT }, () => ({ ...EMPTY_PRODUCT }))
  );

  // FAQs dinâmicos
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);

  function updateProduct(idx: number, field: keyof ProductBlock, value: string) {
    setProducts((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function addFaq() {
    setFaqs((prev) => [...prev, { question: "", answer: "" }]);
  }
  function removeFaq(idx: number) {
    setFaqs((prev) => prev.filter((_, i) => i !== idx));
  }
  function updateFaq(idx: number, field: "question" | "answer", value: string) {
    setFaqs((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Filtra produtos vazios — só envia os que têm pelo menos nome
    const filledProducts = products.filter((p) => p.name.trim().length >= 2);
    if (filledProducts.length === 0) {
      setError("Preencha pelo menos 1 produto (com nome).");
      return;
    }
    if (title.trim().length < 3) {
      setError("Título do ranking obrigatório.");
      return;
    }

    const payload: Top10Input = {
      ranking: {
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        intro: intro.trim() || undefined,
        conclusion: conclusion.trim() || undefined,
        coverUrl: coverUrl.trim() || undefined,
        metaTitle: metaTitle.trim() || undefined,
        metaDesc: metaDesc.trim() || undefined,
        categoryId: categoryId || null,
      },
      products: filledProducts.map((p) => ({
        name: p.name.trim(),
        brand: p.brand.trim() || undefined,
        shortDesc: p.shortDesc.trim() || undefined,
        longDesc: p.longDesc.trim() || undefined,
        imageUrl: p.imageUrl.trim() || undefined,
        currentPrice: p.currentPrice ? Number(p.currentPrice) : null,
        oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
        rating: p.rating ? Number(p.rating) : null,
        pros: p.pros.split("\n").map((s) => s.trim()).filter(Boolean),
        cons: p.cons.split("\n").map((s) => s.trim()).filter(Boolean),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        badge: (p.badge || null) as any,
        amazonUrl: p.amazonUrl.trim() || undefined,
        mercadoLivreUrl: p.mercadoLivreUrl.trim() || undefined,
        shopeeUrl: p.shopeeUrl.trim() || undefined,
      })),
      faqs: faqs
        .filter((f) => f.question.trim() && f.answer.trim())
        .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() })),
    };

    startTransition(async () => {
      try {
        await createTop10Ranking(payload);
      } catch (err) {
        // redirect() lança um erro especial NEXT_REDIRECT — só capturamos erros reais
        if (err instanceof Error && !err.message.includes("NEXT_REDIRECT")) {
          setError(err.message);
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ─── Seção: Dados do Ranking ──────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900 border-b pb-3">
          1. Dados do ranking
        </h2>

        <Field label="Título do Top 10 *" hint="Ex: Top 10 Melhores Formas de Silicone">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            required
          />
        </Field>

        <Field label="Subtítulo">
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="input"
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Categoria">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input"
            >
              <option value="">— Nenhuma —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          <Field label="URL da imagem de capa">
            <input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              className="input"
              placeholder="https://..."
            />
          </Field>
        </div>

        <Field label="Introdução" hint="Texto que aparece no topo da página">
          <textarea
            rows={3}
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Conclusão">
          <textarea
            rows={3}
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
            className="input"
          />
        </Field>

        <details className="border rounded-lg p-4">
          <summary className="text-sm font-medium text-gray-700 cursor-pointer">SEO (opcional)</summary>
          <div className="mt-4 space-y-3">
            <Field label="Meta título">
              <input
                type="text"
                maxLength={70}
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Meta descrição">
              <textarea
                rows={2}
                maxLength={160}
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
                className="input"
              />
            </Field>
          </div>
        </details>
      </section>

      {/* ─── Seção: Produtos ──────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-gray-900">
          2. Produtos do Top 10{" "}
          <span className="text-xs font-normal text-gray-500">
            (preencha quantos quiser, no mínimo 1)
          </span>
        </h2>

        {products.map((p, idx) => (
          <ProductBlockCard
            key={idx}
            position={idx + 1}
            data={p}
            onChange={(field, value) => updateProduct(idx, field, value)}
          />
        ))}
      </section>

      {/* ─── Seção: FAQs ──────────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-base font-semibold text-gray-900">3. Perguntas frequentes (opcional)</h2>
          <button
            type="button"
            onClick={addFaq}
            className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md font-medium"
          >
            + Adicionar pergunta
          </button>
        </div>

        {faqs.length === 0 && (
          <p className="text-sm text-gray-400 italic">Nenhuma pergunta adicionada.</p>
        )}

        {faqs.map((f, idx) => (
          <div key={idx} className="border rounded-lg p-4 space-y-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">FAQ #{idx + 1}</span>
              <button
                type="button"
                onClick={() => removeFaq(idx)}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Remover
              </button>
            </div>
            <Field label="Pergunta">
              <input
                type="text"
                value={f.question}
                onChange={(e) => updateFaq(idx, "question", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Resposta">
              <textarea
                rows={2}
                value={f.answer}
                onChange={(e) => updateFaq(idx, "answer", e.target.value)}
                className="input"
              />
            </Field>
          </div>
        ))}
      </section>

      {/* ─── Erros e botões ───────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
          {error}
        </div>
      )}

      <div className="flex gap-3 sticky bottom-4 bg-white p-4 border rounded-xl shadow-lg">
        <button
          type="submit"
          disabled={pending}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "Criando…" : "Criar Top 10 (rascunho)"}
        </button>
        <a
          href="/admin/rankings"
          className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancelar
        </a>
        <span className="ml-auto self-center text-xs text-gray-500">
          O ranking nasce como <strong>rascunho</strong>. Você publica depois, na tela de edição.
        </span>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          background: white;
        }
        .input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
      `}</style>
    </form>
  );
}

// ─── Subcomponentes ──────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function ProductBlockCard({
  position,
  data,
  onChange,
}: {
  position: number;
  data: ProductBlock;
  onChange: (field: keyof ProductBlock, value: string) => void;
}) {
  return (
    <details
      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      open={position <= 3}
    >
      <summary className="px-5 py-3 bg-gray-50 cursor-pointer flex items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold">
            {position}
          </span>
          <span className="text-sm font-medium text-gray-900">
            {data.name || `Produto ${position}`}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {data.name ? "✓ preenchido" : "vazio"}
        </span>
      </summary>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nome do produto *">
            <input
              type="text"
              value={data.name}
              onChange={(e) => onChange("name", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Marca">
            <input
              type="text"
              value={data.brand}
              onChange={(e) => onChange("brand", e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <Field label="Descrição curta" hint="Uma frase resumindo o produto">
          <input
            type="text"
            maxLength={300}
            value={data.shortDesc}
            onChange={(e) => onChange("shortDesc", e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Descrição longa">
          <textarea
            rows={2}
            value={data.longDesc}
            onChange={(e) => onChange("longDesc", e.target.value)}
            className="input"
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="URL da imagem">
            <input
              type="url"
              value={data.imageUrl}
              onChange={(e) => onChange("imageUrl", e.target.value)}
              className="input"
              placeholder="https://..."
            />
          </Field>
          <Field label="Selo">
            <select
              value={data.badge}
              onChange={(e) => onChange("badge", e.target.value)}
              className="input"
            >
              <option value="">— Nenhum —</option>
              <option value="BEST_VALUE">Melhor custo-benefício</option>
              <option value="BEST_SELLER">Mais vendido</option>
              <option value="PREMIUM">Premium</option>
              <option value="CHEAPEST">Mais barato</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Preço atual (R$)">
            <input
              type="number"
              step="0.01"
              value={data.currentPrice}
              onChange={(e) => onChange("currentPrice", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Preço antigo (R$)">
            <input
              type="number"
              step="0.01"
              value={data.oldPrice}
              onChange={(e) => onChange("oldPrice", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Nota (0 a 5)">
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={data.rating}
              onChange={(e) => onChange("rating", e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Prós" hint="Um por linha">
            <textarea
              rows={3}
              value={data.pros}
              onChange={(e) => onChange("pros", e.target.value)}
              className="input"
              placeholder="Ótimo desempenho&#10;Bateria duradoura"
            />
          </Field>
          <Field label="Contras" hint="Um por linha">
            <textarea
              rows={3}
              value={data.cons}
              onChange={(e) => onChange("cons", e.target.value)}
              className="input"
              placeholder="Preço elevado"
            />
          </Field>
        </div>

        <div className="space-y-3 pt-2 border-t">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Links de afiliado</p>
          <Field label="Amazon">
            <input
              type="url"
              value={data.amazonUrl}
              onChange={(e) => onChange("amazonUrl", e.target.value)}
              className="input"
              placeholder="https://amazon.com.br/..."
            />
          </Field>
          <Field label="Mercado Livre">
            <input
              type="url"
              value={data.mercadoLivreUrl}
              onChange={(e) => onChange("mercadoLivreUrl", e.target.value)}
              className="input"
              placeholder="https://mercadolivre.com.br/..."
            />
          </Field>
          <Field label="Shopee">
            <input
              type="url"
              value={data.shopeeUrl}
              onChange={(e) => onChange("shopeeUrl", e.target.value)}
              className="input"
              placeholder="https://shopee.com.br/..."
            />
          </Field>
        </div>
      </div>
    </details>
  );
}
