"use client";

import { useState, useTransition } from "react";
import { importTop10WithCategory } from "@/lib/actions/top10";
import { top10Schema } from "@/lib/validations";

interface Props {
  categories: { id: string; name: string }[];
}

type FileEntry = {
  name: string;
  data: unknown;
  status: "pending" | "importing" | "done" | "error";
  error?: string;
  rankingTitle?: string;
  categoryName?: string;
};

export function Top10Form({ categories }: Props) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [importing, startTransition] = useTransition();
  const [defaultCategory, setDefaultCategory] = useState("");

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files;
    if (!selected) return;

    const entries: FileEntry[] = [];
    for (const file of Array.from(selected)) {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);

        // Extrai categoryName antes de validar (campo custom, não no schema)
        const categoryName = parsed.ranking?.categoryName || undefined;
        if (parsed.ranking?.categoryName) {
          delete parsed.ranking.categoryName;
        }

        const validated = top10Schema.safeParse(parsed);
        if (!validated.success) {
          entries.push({
            name: file.name,
            data: null,
            status: "error",
            error: "JSON inválido: " + validated.error.issues[0]?.message,
          });
        } else {
          entries.push({
            name: file.name,
            data: parsed,
            status: "pending",
            rankingTitle: parsed.ranking?.title || file.name,
            categoryName,
          });
        }
      } catch {
        entries.push({
          name: file.name,
          data: null,
          status: "error",
          error: "Arquivo não é um JSON válido",
        });
      }
    }
    setFiles((prev) => [...prev, ...entries]);
    e.target.value = "";
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleImportAll() {
    const pending = files.filter((f) => f.status === "pending");
    if (pending.length === 0) return;

    startTransition(async () => {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.status !== "pending" || !file.data) continue;

        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "importing" } : f))
        );

        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const payload = file.data as any;

          // Resolve categoria: do arquivo > dropdown > nenhuma
          const catName =
            file.categoryName ||
            (defaultCategory
              ? categories.find((c) => c.id === defaultCategory)?.name
              : undefined);

          await importTop10WithCategory(payload, catName);

          setFiles((prev) =>
            prev.map((f, idx) => (idx === i ? { ...f, status: "done" } : f))
          );
        } catch (err) {
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i
                ? {
                    ...f,
                    status: "error",
                    error:
                      err instanceof Error ? err.message : "Erro desconhecido",
                  }
                : f
            )
          );
        }
      }
    });
  }

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const doneCount = files.filter((f) => f.status === "done").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <div className="space-y-6">
      {/* Upload */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Importar arquivos JSON
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Selecione um ou mais arquivos .json. Cada arquivo vira um ranking
              DRAFT. Se o JSON tiver{" "}
              <code className="bg-gray-100 px-1 rounded">categoryName</code>, a
              categoria é criada automaticamente.
            </p>
          </div>
        </div>

        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Categoria padrão (quando o JSON não especifica)
            </label>
            <select
              value={defaultCategory}
              onChange={(e) => setDefaultCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">— Nenhuma —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <label className="cursor-pointer bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
            <span>Selecionar arquivos</span>
            <input
              type="file"
              accept=".json"
              multiple
              onChange={handleFiles}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-900">
                {files.length} arquivo(s)
              </span>
              {doneCount > 0 && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  {doneCount} importado(s)
                </span>
              )}
              {errorCount > 0 && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  {errorCount} erro(s)
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFiles([])}
                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-100"
              >
                Limpar lista
              </button>
              <button
                onClick={handleImportAll}
                disabled={pendingCount === 0 || importing}
                className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {importing
                  ? "Importando..."
                  : `Importar ${pendingCount} ranking(s)`}
              </button>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  Arquivo
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  Ranking
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  Categoria
                </th>
                <th className="px-4 py-2 text-center font-medium text-gray-500">
                  Status
                </th>
                <th className="px-4 py-2 text-right font-medium text-gray-500 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {files.map((file, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-600">
                    {file.name}
                  </td>
                  <td className="px-4 py-2.5 text-gray-900">
                    {file.rankingTitle || "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    {file.categoryName ? (
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                        {file.categoryName}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">padrão</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {file.status === "pending" && (
                      <span className="text-xs text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full">
                        Pendente
                      </span>
                    )}
                    {file.status === "importing" && (
                      <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                        Importando...
                      </span>
                    )}
                    {file.status === "done" && (
                      <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        Importado
                      </span>
                    )}
                    {file.status === "error" && (
                      <span
                        className="text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded-full"
                        title={file.error}
                      >
                        Erro
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {file.status !== "importing" && (
                      <button
                        onClick={() => removeFile(idx)}
                        className="text-xs text-gray-400 hover:text-red-600"
                      >
                        Remover
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {files.some((f) => f.status === "error" && f.error) && (
            <div className="px-4 py-3 bg-red-50 border-t border-red-100">
              {files
                .filter((f) => f.status === "error" && f.error)
                .map((f, i) => (
                  <p key={i} className="text-xs text-red-700">
                    <strong>{f.name}:</strong> {f.error}
                  </p>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {files.length === 0 && (
        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-400 text-sm">
            Nenhum arquivo selecionado. Clique em &quot;Selecionar
            arquivos&quot; para importar JSONs.
          </p>
          <p className="text-gray-300 text-xs mt-2">
            Os arquivos ficam na pasta{" "}
            <code>prompts/[categoria]/</code> do projeto.
          </p>
        </div>
      )}
    </div>
  );
}
