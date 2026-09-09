import { cache } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { MetaPixel } from "@/components/public/MetaPixel";
import { GroupCTA } from "@/components/public/GroupCTA";
import { OfferCard } from "@/components/public/OfferCard";
import { groupContent, groupOffers, formatMembers } from "@/lib/group-content";
import type { Metadata } from "next";

// Rota curinga na raiz, pra o anuncio apontar pra buscasampla.com.br/fitness.
// Rotas estaticas (/busca, /categorias, /linksdireto) tem prioridade no Next e
// continuam funcionando; o que nao for grupo cai em notFound().
//
// Estatica ate uma server action revalidar: e o destino do trafego pago, entao
// nenhum clique de anuncio pode custar uma consulta ao banco.
export const revalidate = false;
export const dynamicParams = true;

export async function generateStaticParams() {
  const grupos = await db.whatsAppGroup.findMany({
    where: { active: true },
    select: { slug: true },
  });
  return grupos.map(({ slug }) => ({ slug }));
}

const getGroup = cache((slug: string) =>
  db.whatsAppGroup.findFirst({ where: { slug, active: true } })
);

// Esta rota vive fora do grupo (public), entao nao herda aquele layout e carrega
// o pixel por conta propria. revalidate false pelo mesmo motivo da pagina: um
// valor menor aqui viraria o teto da rota inteira.
const getPixel = unstable_cache(
  () => db.siteSettings.findFirst({ where: { id: "default" }, select: { metaPixelId: true } }),
  ["group-pixel"],
  { revalidate: false }
);

export async function generateMetadata(props: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const grupo = await getGroup(slug);
  if (!grupo) return {};

  const { headline, subheadline } = groupContent(grupo);
  return {
    title: `${grupo.name} — Grupo de ofertas no WhatsApp`,
    description: grupo.description ?? subheadline,
    // Pagina de anuncio nao deve competir com o conteudo do site na busca.
    robots: { index: false, follow: false },
    openGraph: { title: headline, description: subheadline },
  };
}

export default async function GroupPage(props: PageProps<"/[slug]">) {
  const { slug } = await props.params;
  const grupo = await getGroup(slug);
  if (!grupo) notFound();

  const pixel = await getPixel();
  const ofertas = groupOffers(grupo);
  const { headline, subheadline, ctaText, benefits } = groupContent(grupo);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#14100d] text-[#f5efe8]">
      {/* Brilho quente atras do miolo — da profundidade sem pesar no carregamento */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[#c9743a] opacity-[0.13] blur-[120px]"
      />

      {/* No xl a mesma lista deixa de ser faixa e vira cards espalhados atras do
          conteudo. Feito em CSS, e nao renderizando dois blocos, porque cada
          next/image emite um srcset longo — duplicar custava HTML a toa. */}
      <style>{`
        @media (min-width: 1280px) {
          .ofertas {
            /* Escapa da largura da coluna: sem os 100vw os cards ficariam
               dentro do max-w do <main> e cairiam em cima do texto. */
            position: absolute;
            top: 0;
            left: 50%;
            width: 100vw;
            height: 100%;
            transform: translateX(-50%);
            margin: 0;
            pointer-events: none;
          }
          .ofertas-faixa {
            display: block;
            overflow: visible;
            padding: 0;
          }
          .ofertas-faixa > * {
            position: absolute;
            opacity: 0.7;
          }
          .ofertas-faixa > *:nth-child(1) { left: 3%;  top: 8%;  transform: rotate(-6deg); }
          .ofertas-faixa > *:nth-child(2) { right: 3%; top: 10%; transform: rotate(6deg); }
          .ofertas-faixa > *:nth-child(3) { left: 7%;  top: 42%; transform: rotate(3deg); }
          .ofertas-faixa > *:nth-child(4) { right: 7%; top: 44%; transform: rotate(-3deg); }
          .ofertas-faixa > *:nth-child(5) { left: 4%;  top: 74%; transform: rotate(-3deg); }
          .ofertas-faixa > *:nth-child(6) { right: 4%; top: 76%; transform: rotate(3deg); }
          .ofertas-faixa > *:nth-child(n+7) { display: none; }
        }
      `}</style>

      <p className="relative border-b border-[#2a221b] bg-[#1a1510] py-2 text-center text-xs font-semibold tracking-wide text-[#ffc94d]">
        🔥 Ofertas novas todo dia
      </p>

      <main className="relative mx-auto flex min-h-screen max-w-lg flex-col items-center px-5 py-10 xl:max-w-2xl xl:justify-center xl:py-16">
        {/* Logo antes do titulo: quem chega de anuncio precisa reconhecer de quem
            e o grupo antes de decidir entrar. priority porque e o primeiro
            elemento visivel — carregar depois deixa a pagina pulando. */}
        {grupo.logoUrl && (
          <Image
            src={grupo.logoUrl}
            alt={grupo.name}
            width={320}
            height={110}
            priority
            className="mb-6 h-auto w-[220px] rounded-xl object-contain sm:w-[260px] xl:w-[300px]"
          />
        )}

        <h1 className="text-balance text-center text-[30px] font-black leading-[1.1] tracking-tight sm:text-4xl xl:text-[52px] xl:leading-[1.05]">
          {headline}
        </h1>

        <p className="mt-4 max-w-xl text-center text-sm leading-relaxed text-[#a2968a] sm:text-base xl:text-lg">
          {subheadline}
        </p>

        {/* So aparece com numero preenchido no admin. Prova social inventada e a
            primeira coisa que derruba a credibilidade da pagina. */}
        {grupo.memberCount != null && grupo.memberCount > 0 && (
          <p className="mt-5 rounded-full border border-[#2f2620] bg-[#1c1611] px-5 py-2 text-xs text-[#cdc2b6] xl:text-sm">
            <strong className="text-[#f5efe8]">+{formatMembers(grupo.memberCount)} pessoas</strong>{" "}
            já economizando no grupo
          </p>
        )}

        <div className="mt-8 w-full xl:max-w-md">
          <GroupCTA slug={grupo.slug} inviteUrl={grupo.inviteUrl} label={ctaText} />
        </div>

        <p className="mt-4 text-xs text-[#a2968a] xl:text-sm">
          <span className="font-semibold text-[#25d366]">100% grátis</span> · entra e sai quando quiser
        </p>

        {/* Uma lista so para as duas formas. Antes eram dois blocos — um para
            celular, outro absoluto para desktop — e cada next/image emite um
            srcset longo, entao duplicar custava dezenas de KB de HTML numa
            pagina de anuncio. No xl o CSS abaixo reposiciona estes mesmos nos. */}
        {ofertas.length > 0 && (
          <div className="ofertas mt-9 w-screen xl:mt-0">
            <p className="mb-3 px-5 text-center text-[11px] font-semibold uppercase tracking-widest text-[#7d7268] xl:hidden">
              Achados recentes
            </p>
            <div className="ofertas-faixa flex gap-3 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {ofertas.map((o, i) => (
                <OfferCard key={o.url} offer={o} priority={i < 2} />
              ))}
            </div>
          </div>
        )}

        <section className="mt-12 w-full xl:max-w-xl">
          <h2 className="mb-4 text-center text-[11px] font-bold uppercase tracking-widest text-[#c9743a] xl:text-xs">
            No grupo você recebe
          </h2>
          <ul className="space-y-2.5">
            {benefits.map((b) => (
              <li
                key={b.title}
                className="rounded-xl border border-[#2a221b] bg-[#1a1510] px-5 py-4 xl:px-6 xl:py-5"
              >
                <p className="text-sm font-bold xl:text-base">{b.title}</p>
                {b.description && (
                  <p className="mt-1 text-xs leading-relaxed text-[#a2968a] xl:text-sm">{b.description}</p>
                )}
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-10 text-center text-xs text-[#7d7268]">
          🔒 Você entra pelo WhatsApp. Não pedimos cadastro, e-mail nem pagamento.
        </p>

        {/* lead=false: o Lead dispara no clique do botao, no GroupCTA. Aqui so
            PageView, senao todo visitante viraria conversao. */}
        {pixel?.metaPixelId && <MetaPixel pixelId={pixel.metaPixelId} />}
      </main>
    </div>
  );
}
