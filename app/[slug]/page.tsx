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
  const grupos = await db.whatsAppGroup.findMany({
    where: { active: true },
    select: { slug: true },
  });
  return grupos.map(({ slug }) => ({ slug }));
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
