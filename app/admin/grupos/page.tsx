import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteGroup } from "@/lib/actions/grupos";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Grupos de WhatsApp — Admin" };

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export default async function GroupsPage() {
  const grupos = await db.whatsAppGroup.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader
        title="Grupos de WhatsApp"
        action={{ href: "/admin/grupos/novo", label: "+ Novo grupo" }}
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Link do anúncio</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {grupos.map((g) => (
              <tr key={g.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{g.name}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                  <a
                    href={`/${g.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-blue-600"
                  >
                    {SITE}/{g.slug}
                  </a>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      g.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {g.active ? "Ativo" : "Pausado"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <Link
                    href={`/admin/grupos/${g.id}`}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Editar
                  </Link>
                  <DeleteButton action={deleteGroup} id={g.id} />
                </td>
              </tr>
            ))}
            {grupos.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  Nenhum grupo cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Os cliques aparecem no GTM como evento <code className="font-mono">grupo_whatsapp_clique</code>.
        A contagem fica fora do banco de propósito, pra não gerar uma consulta ao Neon por clique de anúncio.
      </p>
    </div>
  );
}
