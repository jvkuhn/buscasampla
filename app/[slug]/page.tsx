import { cache } from "react";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { MetaPixel } from "@/components/public/MetaPixel";
import { GroupCTA } from "@/components/public/GroupCTA";
import { OfferCard, type Offer } from "@/components/public/OfferCard";
import { groupContent, formatMembers } from "@/lib/group-content";
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

// Produtos da categoria do grupo, com desconto real. Sao a prova de que o grupo
// entrega — mostrados antes da pessoa decidir entrar.
const getOffers = cache(async (categoryId: string | null): Promise<Offer[]> => {
  const produtos = await db.product.findMany({
    where: {
      status: "PUBLISHED",
      imageUrl: { not: null },
      currentPrice: { not: null },
      oldPrice: { not: null },
      ...(categoryId ? { categoryId } : {}),
    },
    select: { id: true, name: true, imageUrl: true, currentPrice: true, oldPrice: true },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });

  return produtos.map((p) => ({
    ...p,
    currentPrice: p.currentPrice?.toString() ?? null,
    oldPrice: p.oldPrice?.toString() ?? null,
  }));
});

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

  const [ofertas, pixel] = await Promise.all([getOffers(grupo.categoryId), getPixel()]);
  const { headline, subheadline, ctaText, benefits } = groupContent(grupo);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#14100d] text-[#f5efe8]">
      {/* Brilho quente atras do miolo — da profundidade sem pesar no carregamento */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[#c9743a] opacity-[0.13] blur-[120px]"
      />

      <p className="relative border-b border-[#2a221b] bg-[#1a1510] py-2 text-center text-xs font-semibold tracking-wide text-[#ffc94d]">
        🔥 Ofertas novas todo dia
      </p>

      {/* Cards espalhados atras do conteudo. Apenas em telas largas, onde ha
          espaco morto nas laterais; no celular eles aparecem como faixa. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden xl:block">
        {ofertas.slice(0, 6).map((o, i) => {
          const pos = [
            "left-[3%] top-[8%] -rotate-6",
            "left-[7%] top-[42%] rotate-3",
            "left-[4%] top-[74%] -rotate-3",
            "right-[3%] top-[10%] rotate-6",
            "right-[7%] top-[44%] -rotate-3",
            "right-[4%] top-[76%] rotate-3",
          ][i];
          return (
            <div key={o.id} className={`absolute ${pos} opacity-70`}>
              <OfferCard offer={o} />
            </div>
          );
        })}
      </div>

      <main className="relative mx-auto flex min-h-screen max-w-lg flex-col items-center px-5 py-10">
        <h1 className="text-balance text-center text-[28px] font-black leading-[1.12] tracking-tight sm:text-4xl">
          {headline}
        </h1>

        <p className="mt-3 text-center text-sm leading-relaxed text-[#a2968a] sm:text-base">
          {subheadline}
        </p>

        {/* So aparece com numero preenchido no admin. Prova social inventada e a
            primeira coisa que derruba a credibilidade da pagina. */}
        {grupo.memberCount != null && grupo.memberCount > 0 && (
          <p className="mt-4 rounded-full border border-[#2f2620] bg-[#1c1611] px-4 py-1.5 text-xs text-[#cdc2b6]">
            <strong className="text-[#f5efe8]">+{formatMembers(grupo.memberCount)} pessoas</strong>{" "}
            já economizando no grupo
          </p>
        )}

        <div className="mt-7 w-full">
          <GroupCTA slug={grupo.slug} inviteUrl={grupo.inviteUrl} label={ctaText} />
        </div>

        <p className="mt-3 text-xs text-[#a2968a]">
          <span className="font-semibold text-[#25d366]">100% grátis</span> · entra e sai quando quiser
        </p>

        {/* No celular os cards viram faixa deslizante em vez de sumirem: e de
            onde vem quase todo o trafego de anuncio, e sao eles que provam que
            o grupo entrega oferta de verdade. */}
        {ofertas.length > 0 && (
          <div className="mt-9 w-screen xl:hidden">
            <p className="mb-3 px-5 text-center text-[11px] font-semibold uppercase tracking-widest text-[#7d7268]">
              Achados recentes
            </p>
            <div className="flex gap-3 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {ofertas.map((o) => (
                <OfferCard key={o.id} offer={o} />
              ))}
            </div>
          </div>
        )}

        <section className="mt-10 w-full">
          <h2 className="mb-3 text-center text-[11px] font-bold uppercase tracking-widest text-[#c9743a]">
            No grupo você recebe
          </h2>
          <ul className="space-y-2.5">
            {benefits.map((b) => (
              <li
                key={b.title}
                className="rounded-xl border border-[#2a221b] bg-[#1a1510] px-4 py-3.5"
              >
                <p className="text-sm font-bold">{b.title}</p>
                {b.description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-[#a2968a]">{b.description}</p>
                )}
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-8 text-center text-xs text-[#7d7268]">
          🔒 Você entra pelo WhatsApp. Não pedimos cadastro, e-mail nem pagamento.
        </p>

        {/* lead=false: o Lead dispara no clique do botao, no GroupCTA. Aqui so
            PageView, senao todo visitante viraria conversao. */}
        {pixel?.metaPixelId && <MetaPixel pixelId={pixel.metaPixelId} />}
      </main>
    </div>
  );
}
