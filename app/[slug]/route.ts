import { db } from "@/lib/db";
import { groupContent, groupOffers, formatMembers, type Offer } from "@/lib/group-content";
import { pixelSnippet } from "@/lib/pixel-snippet";

/**
 * Landing do grupo servida como HTML puro, sem React no cliente.
 *
 * Era uma page.tsx e ficava inutilizavel no celular. Medido em producao: 63 KB
 * de HTML — 42% so de srcset e 34% de payload de hidratacao — mais ~180 KB do
 * runtime do Next e 48 KB da fonte, tudo antes de aparecer qualquer coisa na
 * tela. Para uma pagina com logo, titulo, botao e alguns cards, e peso que nao
 * se paga: quem chega aqui veio de anuncio e desiste na tela branca, o que e
 * clique comprado e jogado fora.
 *
 * Como Route Handler estatico sai ~10 KB, sem framework nenhum. O unico script
 * e o pixel, que precisa existir de qualquer forma.
 *
 * O que se perde: o srcset responsivo do next/image. Em troca cada imagem
 * aponta para uma largura fixa do otimizador — que continua otimizando, so nao
 * despeja 15 variantes por imagem dentro do HTML.
 */
export const dynamic = "force-static";
export const dynamicParams = true;

export async function generateStaticParams() {
  const grupos = await db.whatsAppGroup.findMany({
    where: { active: true },
    select: { slug: true },
  });
  return grupos.map(({ slug }) => ({ slug }));
}

// Largura fixa em vez de srcset: 640 cobre o card em telas 2x e 3x e o
// otimizador entrega webp. Era daqui que vinham os 27 KB de srcset.
function otimizada(url: string, w = 640) {
  return `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=75`;
}

function escapar(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function numero(v?: string) {
  if (!v) return 0;
  const n = Number(v.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function brl(v?: string) {
  const n = numero(v);
  return n ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : (v ?? "");
}

function cardHtml(o: Offer, eager: boolean) {
  const de = numero(o.oldPrice);
  const por = numero(o.newPrice);
  const off = de && por && de > por ? Math.round((1 - por / de) * 100) : null;

  const info =
    o.title || o.newPrice
      ? `<div class="info">${o.title ? `<p class="nome">${escapar(o.title)}</p>` : ""}` +
        `${o.oldPrice ? `<p class="de">${escapar(brl(o.oldPrice))}</p>` : ""}` +
        `${o.newPrice ? `<p class="por">${escapar(brl(o.newPrice))}</p>` : ""}</div>`
      : "";

  return (
    `<div class="card"><div class="foto">` +
    `<img src="${escapar(otimizada(o.url))}" alt="${escapar(o.title ?? "")}" width="164" height="164" ` +
    `loading="${eager ? "eager" : "lazy"}" decoding="async">` +
    `${off ? `<span class="off">-${off}%</span>` : ""}</div>${info}</div>`
  );
}

export async function GET(_req: Request, ctx: RouteContext<"/[slug]">) {
  const { slug } = await ctx.params;

  const [grupo, settings] = await Promise.all([
    db.whatsAppGroup.findFirst({ where: { slug, active: true } }),
    db.siteSettings.findFirst({ where: { id: "default" }, select: { metaPixelId: true } }),
  ]);

  if (!grupo) {
    return new Response("Not found", { status: 404, headers: { "content-type": "text/plain" } });
  }

  const { headline, subheadline, ctaText, benefits } = groupContent(grupo);
  const ofertas = groupOffers(grupo);
  const pixel = settings?.metaPixelId ?? null;

  const logo = grupo.logoUrl
    ? `<img class="logo" src="${escapar(otimizada(grupo.logoUrl, 640))}" alt="${escapar(grupo.name)}" width="220" height="76" fetchpriority="high" decoding="async">`
    : "";

  const membros =
    grupo.memberCount && grupo.memberCount > 0
      ? `<p class="membros"><b>+${formatMembers(grupo.memberCount)} pessoas</b> já economizando no grupo</p>`
      : "";

  const faixa = ofertas.length
    ? `<div class="faixa">${ofertas.map((o, i) => cardHtml(o, i < 2)).join("")}</div>`
    : "";

  const lista = benefits
    .map((b) => `<li><b>${escapar(b.title)}</b>${b.description ? `<span>${escapar(b.description)}</span>` : ""}</li>`)
    .join("");

  // O Lead dispara no clique, nao no carregamento: senao todo visitante viraria
  // conversao e a Meta aprenderia a buscar quem abre link, nao quem entra.
  const scripts = pixel
    ? `<script>${pixelSnippet(pixel, false)}</script>` +
      `<noscript><img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=${escapar(pixel)}&amp;ev=PageView&amp;noscript=1"></noscript>` +
      `<script>document.getElementById("entrar").addEventListener("click",function(){window.fbq&&window.fbq("track","Lead",{content_name:${JSON.stringify(grupo.slug)}})})</script>`
    : "";

  const html =
    `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>${escapar(grupo.name)} — Grupo de ofertas no WhatsApp</title>` +
    `<meta name="description" content="${escapar(grupo.description ?? subheadline)}">` +
    `<meta name="robots" content="noindex,nofollow">` +
    `<style>*{box-sizing:border-box}body{margin:0;background:#14100d;color:#f5efe8;font:16px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased}.topo{margin:0;padding:8px;text-align:center;font-size:12px;font-weight:600;color:#ffc94d;background:#1a1510;border-bottom:1px solid #2a221b}main{max-width:520px;margin:0 auto;padding:32px 20px 48px;text-align:center}.logo{width:220px;height:auto;margin:0 auto 22px;display:block;border-radius:12px}h1{margin:0;font-size:30px;line-height:1.12;font-weight:800;letter-spacing:-.02em}.sub{margin:14px 0 0;font-size:15px;color:#a2968a}.membros{display:inline-block;margin:18px 0 0;padding:7px 18px;border-radius:999px;border:1px solid #2f2620;background:#1c1611;font-size:13px;color:#cdc2b6}.cta{display:block;margin:28px auto 0;padding:17px 20px;border-radius:16px;background:#25d366;color:#06371a;text-decoration:none;font-weight:800;font-size:17px;box-shadow:0 0 38px -10px rgba(37,211,102,.75)}.cta small{display:block;margin-top:3px;font-size:12px;font-weight:600;color:#0a5228}.gratis{margin:14px 0 0;font-size:13px;color:#a2968a}.gratis b{color:#25d366}.faixa{display:flex;gap:12px;overflow-x:auto;padding:4px 20px 12px;margin:32px -20px 0;scrollbar-width:none}.faixa::-webkit-scrollbar{display:none}.card{flex:0 0 164px;border:1px solid #31281f;border-radius:14px;background:#1c1611;overflow:hidden;text-align:left}.foto{position:relative;aspect-ratio:1;background:#fff}.foto img{width:100%;height:100%;object-fit:contain;padding:8px;display:block}.off{position:absolute;left:8px;top:8px;padding:2px 6px;border-radius:6px;background:#e5484d;color:#fff;font-size:11px;font-weight:700}.info{padding:10px}.nome{margin:0;font-size:12px;color:#cdc2b6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.de{margin:4px 0 0;font-size:11px;color:#7d7268;text-decoration:line-through}.por{margin:0;font-size:15px;font-weight:800;color:#ffc94d}h2{margin:38px 0 14px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#c9743a}ul{list-style:none;margin:0;padding:0;text-align:left}li{border:1px solid #2a221b;border-radius:12px;background:#1a1510;padding:14px 16px;margin-bottom:10px}li b{display:block;font-size:14px}li span{display:block;margin-top:3px;font-size:12px;color:#a2968a}.rodape{margin:30px 0 0;font-size:12px;color:#7d7268}@media(min-width:900px){main{max-width:640px;padding-top:56px}h1{font-size:46px}.sub{font-size:17px}.logo{width:280px}.cta{font-size:19px;max-width:420px}}</style></head><body>` +
    `<p class="topo">🔥 Ofertas novas todo dia</p><main>` +
    logo +
    `<h1>${escapar(headline)}</h1><p class="sub">${escapar(subheadline)}</p>` +
    membros +
    `<a class="cta" id="entrar" href="${escapar(grupo.inviteUrl)}" target="_blank" rel="noopener noreferrer">${escapar(ctaText)}<small>Receba as ofertas todo dia</small></a>` +
    `<p class="gratis"><b>100% grátis</b> · entra e sai quando quiser</p>` +
    faixa +
    `<h2>No grupo você recebe</h2><ul>${lista}</ul>` +
    `<p class="rodape">🔒 Você entra pelo WhatsApp. Não pedimos cadastro, e-mail nem pagamento.</p>` +
    `</main>${scripts}</body></html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
