import { db } from "../lib/db";
import "dotenv/config";

/**
 * Pre-gera as variantes de imagem das landings de grupo no otimizador da Vercel.
 *
 * Por que existe: o otimizador transforma sob demanda e cacheia por origem +
 * largura. O celular pede larguras maiores que o desktop (DPR 2-3 pede w=640
 * onde o desktop pede w=256), entao abrir a pagina no PC nao aquece nada do que
 * o celular vai usar. O primeiro visitante de anuncio pagava esse custo — foi
 * exatamente o que aconteceu depois do primeiro upload.
 *
 * Rode depois de subir imagens novas em /admin/grupos. O cache dura 30 dias e
 * sobrevive a deploy (a chave e a URL da origem, nao a versao do site).
 */

// Larguras que Next oferece no srcset e que celular/desktop de fato escolhem
// para os cards (~164-192px) e para o logo (~220-300px).
const LARGURAS = [256, 384, 640, 750, 828];

// Producao por padrao, e nao NEXT_PUBLIC_SITE_URL: no .env local essa variavel
// aponta pro localhost, e aquecer o cache da maquina de quem roda nao ajuda
// ninguem. Passe outra base como argumento para testar contra um preview.
const SITE = process.argv[2] ?? "https://buscasampla.com.br";

interface Offer {
  url?: string;
}

async function main() {
  const grupos = await db.whatsAppGroup.findMany({
    where: { active: true },
    select: { slug: true, logoUrl: true, offers: true },
  });

  const origens = new Set<string>();
  for (const g of grupos) {
    if (g.logoUrl) origens.add(g.logoUrl);
    if (Array.isArray(g.offers)) {
      for (const o of g.offers as unknown as Offer[]) {
        if (o?.url) origens.add(o.url);
      }
    }
  }

  if (origens.size === 0) {
    console.log("Nenhuma imagem de grupo para aquecer.");
    return;
  }

  console.log(`${origens.size} imagem(ns) x ${LARGURAS.length} larguras\n`);
  let frias = 0;

  for (const origem of origens) {
    const nome = origem.split("/").pop()?.slice(0, 38) ?? origem;
    const marcas: string[] = [];

    for (const w of LARGURAS) {
      const url = `${SITE}/_next/image?url=${encodeURIComponent(origem)}&w=${w}&q=75`;
      const inicio = Date.now();
      // O Accept importa: sem ele a Vercel devolve o formato original e a
      // variante webp — que e a que o navegador realmente pede — fica fria.
      const res = await fetch(url, {
        headers: { Accept: "image/avif,image/webp,*/*" },
      });
      const cache = res.headers.get("x-vercel-cache") ?? "?";
      if (cache !== "HIT") frias++;
      marcas.push(`${w}:${cache === "HIT" ? "ok" : `gerada ${Date.now() - inicio}ms`}`);
    }

    console.log(`  ${nome.padEnd(40)} ${marcas.join("  ")}`);
  }

  console.log(frias === 0 ? "\nTudo ja estava quente." : `\n${frias} variante(s) geradas agora.`);
}

main()
  .catch((e) => {
    console.error("ERRO:", e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
