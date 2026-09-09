import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { GroupRedirect } from "@/components/public/GroupRedirect";
import { GTMGate } from "@/components/public/GTMGate";
import { MetaPixelGate } from "@/components/public/MetaPixelGate";
import { CookieBanner } from "@/components/public/CookieBanner";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";

// Rota curinga na raiz, pra o anuncio poder apontar pra buscasampla.com.br/fitness.
// Rotas estaticas (/busca, /categorias, /linksdireto) tem prioridade no Next e
// continuam funcionando; o que nao for grupo cai em notFound().
//
// ISR longo porque isto e o destino do trafego pago: sem cache, cada clique de
// anuncio seria uma consulta ao Neon. A troca de link revalida na hora pela
// server action, entao a validade alta nao atrasa nada na pratica.
export const revalidate = 3600;
// generateStaticParams vazio + dynamicParams: sem isto o Next 16 mantem a rota
// dinamica e o `revalidate` acima nao vale nada. Com a lista vazia, nada e
// gerado no build (seriam milhares de queries) e cada pagina e renderizada uma
// unica vez, no primeiro acesso, ficando em cache dali em diante.
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

async function buscarGrupo(slug: string) {
  return db.whatsAppGroup.findFirst({ where: { slug, active: true } });
}

// Esta rota vive fora do grupo (public), entao nao herda aquele layout e
// precisa carregar o GTM e o pixel por conta propria — sem isto o evento de
// clique do anuncio nao chega em lugar nenhum.
const getTracking = unstable_cache(
  () =>
    db.siteSettings.findFirst({
      where: { id: "default" },
      select: { gtmId: true, metaPixelId: true },
    }),
  ["group-tracking"],
  { revalidate: 300 }
);

export async function generateMetadata(props: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const grupo = await buscarGrupo(slug);
  if (!grupo) return {};

  return {
    title: `${grupo.name} — entrar no grupo`,
    description: grupo.description ?? `Entre no grupo ${grupo.name} no WhatsApp.`,
    // Pagina de anuncio nao deve competir com o conteudo do site na busca.
    robots: { index: false, follow: false },
  };
}

export default async function GroupPage(props: PageProps<"/[slug]">) {
  const { slug } = await props.params;
  const [grupo, tracking] = await Promise.all([buscarGrupo(slug), getTracking()]);
  if (!grupo) notFound();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#111b21] px-6 text-center">
      <div>
        <div
          className="mx-auto mb-6 h-11 w-11 animate-spin rounded-full border-4 border-[#25d366] border-t-transparent"
          role="status"
          aria-label="Carregando"
        />
        <p className="text-base text-[#e9edef]">Abrindo o grupo {grupo.name} no WhatsApp...</p>

        {/* Rede de seguranca: se o JS falhar ou o redirect for bloqueado, ainda
            existe um caminho manual em vez de uma tela parada. */}
        <a
          href={grupo.inviteUrl}
          className="mt-5 inline-block text-sm text-[#25d366] underline"
        >
          Clique aqui se não abrir automaticamente
        </a>

        {tracking?.gtmId && <GTMGate gtmId={tracking.gtmId} />}
        {tracking?.metaPixelId && <MetaPixelGate pixelId={tracking.metaPixelId} />}
        <CookieBanner />
        <GroupRedirect slug={grupo.slug} inviteUrl={grupo.inviteUrl} />
      </div>
    </main>
  );
}
