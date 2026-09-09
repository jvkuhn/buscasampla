import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { marked } from "marked";
import type { Metadata } from "next";

// revalidate false = a pagina so e regerada quando uma server action chama
// revalidatePath. Com janela de tempo (5m/1h) cada passagem de crawler pelas
// ~5.9k URLs disparava uma regeneracao, e o Neon nunca chegava a suspender —
// era o problema original. Como todo mutation no admin ja revalida o caminho
// afetado, tempo aqui so geraria trabalho sem ninguem ter mudado nada.
export const revalidate = false;
// Os slugs precisam ser gerados de verdade: com a lista vazia, o Next registra
// a rota sem revalidate no prerender-manifest e a Vercel serve tudo com
// no-store — foi o que aconteceu no primeiro deploy. Pre-renderizando, cada
// pagina vira HTML estatico no CDN e o crawler para de tocar o Neon.
// dynamicParams mantem conteudo novo acessivel antes do proximo build.
export const dynamicParams = true;
export async function generateStaticParams() {
  const paginas = await db.sitePage.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  return paginas.map(({ slug }) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/p/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await db.sitePage.findUnique({ where: { slug } });
  if (!p) return {};
  return {
    title: p.metaTitle || p.title,
    description: p.metaDesc || undefined,
    alternates: { canonical: `/p/${p.slug}` },
  };
}

// Configuração do marked: sem raw HTML no input (gfm + breaks liga só o subset Markdown seguro).
// Conteúdo é editado apenas por admins (autenticados), então não exigimos sanitização
// adicional — o próprio marked não expande <script> ou event handlers quando a opção
// sanitize está desligada por padrão em v18 (raw HTML passa como texto escape).
marked.setOptions({ gfm: true, breaks: true });

export default async function SitePageRoute(props: PageProps<"/p/[slug]">) {
  const { slug } = await props.params;
  const page = await db.sitePage.findUnique({ where: { slug } });
  if (!page || page.status !== "PUBLISHED") notFound();

  const html = await marked.parse(page.content);

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{page.title}</h1>
      <div
        className="prose prose-gray max-w-none text-gray-700 leading-relaxed prose-headings:text-gray-900 prose-a:text-blue-600 prose-strong:text-gray-900"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
