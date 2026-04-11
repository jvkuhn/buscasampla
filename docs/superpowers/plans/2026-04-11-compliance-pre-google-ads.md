# Compliance pré-Google Ads — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o conjunto mínimo de mudanças (páginas institucionais, banner de cookies, disclosure de afiliado, headers de segurança, auditoria `rel`) para que o site BuscasAmpla atenda LGPD e políticas do Google Ads, sem comprometer funcionalidade ou visual.

**Architecture:** Mudanças isoladas em componentes novos + edições pontuais em arquivos existentes. Sem migração de banco. Sem dependências npm novas. Cookie consent por `localStorage` com hook React SSR-safe. GTM é gateado por um Client Component wrapper que só renderiza após consentimento explícito.

**Tech Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + Prisma 6. Sem framework de teste — verificação por build/lint/smoke tests manuais (dev server + DevTools + curl).

**Spec de referência:** `docs/superpowers/specs/2026-04-11-compliance-pre-google-ads-design.md` (commit `d3b8192`).

---

## Nota sobre verificação neste repositório

Este projeto **não tem** suíte de testes automatizada (zero arquivos `*.test.*` ou `*.spec.*`, nenhum `vitest`/`jest`/`playwright` instalado). Adicionar infraestrutura de teste fica fora do escopo do mínimo viável.

A cada task, a "verificação" consiste em:

1. **Comportamento esperado** declarado antes da mudança (como uma asserção de teste);
2. **`npm run lint`** após a edição (captura erros de ESLint/TypeScript);
3. **`npm run dev`** + navegação manual no navegador quando for UI;
4. **`curl -sI`** ou **DevTools Network tab** quando for header/request;
5. **`npm run build`** na task final (verifica que tudo compila).

Cada task termina com um commit isolado. Commits pequenos e frequentes são deliberados.

---

## Estrutura de arquivos

**Novos arquivos (7):**

| Arquivo | Responsabilidade |
|---|---|
| `scripts/seed-institutional-pages.ts` | Script one-shot idempotente que cria 4 SitePage em DRAFT |
| `lib/cookie-consent.ts` | Hook `useCookieConsent`, função `openCookieBanner`, constantes de eventos |
| `components/public/CookieBanner.tsx` | Banner fixo no canto inferior, renderiza se consent == null |
| `components/public/GTMGate.tsx` | Wrapper client que só renderiza `<GTMHead>` quando consent == "accepted" |
| `components/public/AffiliateDisclosure.tsx` | Caixa informativa estática para ranking/produto |
| `components/public/ManageCookiesButton.tsx` | Botão client no footer que dispara `openCookieBanner` |
| `docs/superpowers/plans/2026-04-11-compliance-pre-google-ads.md` | Este arquivo |

**Arquivos modificados (6):**

| Arquivo | O que muda |
|---|---|
| `next.config.ts` | Adiciona 2 headers (HSTS, Permissions-Policy) |
| `app/linksdireto/page.tsx` | Corrige `rel` dos `<a>` gerados a partir de `manualLinks` |
| `app/(public)/layout.tsx` | Troca `<GTMHead>` por `<GTMGate>`; monta `<CookieBanner>` |
| `app/(public)/ranking/[slug]/page.tsx` | Insere `<AffiliateDisclosure />` após o header |
| `app/(public)/produto/[slug]/page.tsx` | Insere `<AffiliateDisclosure />` entre breadcrumb e card principal |
| `components/public/PublicFooter.tsx` | Adiciona `<ManageCookiesButton />` ao final do `<nav>` + classe `flex-wrap` |

**Arquivos intocados (verificados manualmente):**
- `components/public/AffiliateLink.tsx` — já tem `rel="noopener noreferrer sponsored nofollow"` correto
- `components/public/GoogleTagManager.tsx` — `GTMHead` é reusado dentro de `GTMGate`, `GTMNoScript` permanece
- `prisma/schema.prisma` — nenhuma migração
- `prisma/seed.ts` — não tocado para não misturar seed demo com seed de institucionais

---

## Task 1: Adicionar headers de segurança HSTS e Permissions-Policy

**Files:**
- Modify: `next.config.ts`

**Comportamento esperado:**
- Toda resposta HTTP do site passa a incluir os headers `Strict-Transport-Security` e `Permissions-Policy` com os valores especificados.
- Headers existentes (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) não são alterados.

- [ ] **Step 1.1: Editar `next.config.ts`**

Substituir o array `headers` da função `headers()` pelo bloco abaixo (já incluídos os headers novos nas 2 últimas linhas):

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazon.com.br" },
      { protocol: "https", hostname: "**.mercadolivre.com.br" },
      { protocol: "https", hostname: "**.mlstatic.com" },
      { protocol: "https", hostname: "**.shopee.com.br" },
      { protocol: "https", hostname: "**.kabum.com.br" },
      { protocol: "https", hostname: "**.pichau.com.br" },
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
    unoptimized: false,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 1.2: Rodar lint**

```bash
npm run lint
```

Expected: sem erros.

- [ ] **Step 1.3: Verificar headers no dev server**

```bash
npm run dev
```

Em outro terminal:

```bash
curl -sI http://localhost:3000/ | grep -Ei "strict-transport|permissions-policy"
```

Expected output (2 linhas):
```
strict-transport-security: max-age=63072000; includeSubDomains; preload
permissions-policy: camera=(), microphone=(), geolocation=(), payment=()
```

Se aparecerem as 2 linhas, a task está verificada. Parar o dev server com Ctrl+C.

- [ ] **Step 1.4: Commit**

```bash
git add next.config.ts
git commit -m "$(cat <<'EOF'
feat(security): adiciona headers HSTS e Permissions-Policy

Adiciona Strict-Transport-Security (max-age 2 anos + preload) e
Permissions-Policy bloqueando camera/microphone/geolocation/payment,
ambos requisitos de defesa em profundidade para o sub-projeto A
(compliance pré-Google Ads).
EOF
)"
```

---

## Task 2: Corrigir `rel` dos links em `app/linksdireto/page.tsx`

**Files:**
- Modify: `app/linksdireto/page.tsx:32-41`

**Comportamento esperado:**
- Todo `<a>` da página `/linksdireto` passa a ter `rel="noopener noreferrer sponsored nofollow"`.
- O comportamento visual e de navegação da página é idêntico ao atual.
- A página continua `robots: { index: false, follow: false }` (não mudar).

- [ ] **Step 2.1: Editar `app/linksdireto/page.tsx`**

Localizar o bloco `links.map(...)` (começa na linha ~31). Substituir o atributo `rel` da tag `<a>`:

**Antes (linha ~36):**
```tsx
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-blue-50 hover:scale-[1.02] transition-all shadow-md"
            >
```

**Depois:**
```tsx
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="block w-full text-center px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-blue-50 hover:scale-[1.02] transition-all shadow-md"
            >
```

Nada mais muda no arquivo.

- [ ] **Step 2.2: Rodar lint**

```bash
npm run lint
```

Expected: sem erros.

- [ ] **Step 2.3: Verificar no dev server**

```bash
npm run dev
```

No navegador, abrir `http://localhost:3000/linksdireto`. Se a lista de links estiver vazia (porque `settings.manualLinks` pode estar vazio), **pular** a verificação visual — o commit ainda é válido porque o `rel` só é renderizado quando há links. Caso contrário, abrir DevTools (F12) → Elements → selecionar qualquer `<a>` renderizado → confirmar `rel="noopener noreferrer sponsored nofollow"`.

Parar o dev server com Ctrl+C.

- [ ] **Step 2.4: Commit**

```bash
git add app/linksdireto/page.tsx
git commit -m "$(cat <<'EOF'
fix(linksdireto): adiciona sponsored nofollow ao rel dos links manuais

Os links gerados a partir de settings.manualLinks na landing
/linksdireto tinham apenas rel="noopener noreferrer". Adiciona
"sponsored nofollow" para marcar explicitamente como afiliados
(defesa em profundidade, mesmo a página sendo noindex).
EOF
)"
```

---

## Task 3: Criar script de seed das páginas institucionais

**Files:**
- Create: `scripts/seed-institutional-pages.ts`

**Comportamento esperado:**
- Rodar `npx tsx scripts/seed-institutional-pages.ts` cria 4 `SitePage` em `status: DRAFT` se os slugs ainda não existirem.
- Rodar o script uma segunda vez **não** duplica, **não** sobrescreve — simplesmente informa quais slugs já existem.
- Os 4 templates incluem os placeholders `[NOME DO RESPONSÁVEL]`, `[EMAIL DE CONTATO]`, `[CIDADE/UF]`, `[DATA]` para serem preenchidos via admin.
- O script fecha a conexão Prisma no final (`$disconnect`).

Esta task só cria o arquivo — executar fica na Task 4.

- [ ] **Step 3.1: Criar `scripts/seed-institutional-pages.ts`**

Conteúdo completo do arquivo:

```ts
/**
 * Seed one-shot das 4 páginas institucionais exigidas pelo sub-projeto A
 * (compliance pré-Google Ads). Idempotente: rodar várias vezes não duplica.
 *
 * Executar com: npx tsx scripts/seed-institutional-pages.ts
 *
 * Depois de executar, abrir /admin/paginas, substituir os placeholders
 * ([NOME DO RESPONSÁVEL], [EMAIL DE CONTATO], [CIDADE/UF], [DATA])
 * e mudar o status para PUBLISHED antes de ativar Google Ads.
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

interface PageSeed {
  slug: string;
  title: string;
  metaTitle: string;
  metaDesc: string;
  content: string;
}

const PRIVACIDADE = `# Política de Privacidade

**Última atualização:** [DATA]

Esta Política de Privacidade descreve como a **BuscasAmpla** ("nós", "nosso site") coleta, usa e protege informações dos visitantes ("você"), em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).

## 1. Identificação do Controlador

O controlador dos dados é **[NOME DO RESPONSÁVEL]**, operando a marca BuscasAmpla a partir de **[CIDADE/UF]**. Para exercer qualquer direito previsto nesta política, entre em contato pelo e-mail **[EMAIL DE CONTATO]**.

## 2. Dados Coletados

A BuscasAmpla é um site informativo — não exigimos cadastro, login ou envio de dados pessoais para navegação. Os dados tratados são limitados a:

- **Dados de navegação** coletados automaticamente por ferramentas de análise de terceiros (Google Analytics / Google Tag Manager) **apenas após o seu consentimento**: endereço IP (anonimizado pelo Google), tipo de dispositivo, navegador, páginas visitadas, tempo de permanência, origem do tráfego.
- **Preferência de cookies** armazenada no seu próprio navegador (localStorage), nunca em nossos servidores.

## 3. Finalidade do Tratamento

Os dados coletados são utilizados exclusivamente para:

- Medir a audiência e entender quais conteúdos são mais úteis aos leitores;
- Melhorar a experiência de navegação;
- Cumprir obrigações legais.

Nós **não** vendemos, alugamos ou compartilhamos seus dados com terceiros para fins de marketing direto.

## 4. Base Legal (art. 7º da LGPD)

- **Legítimo interesse** para medir e aprimorar o funcionamento do site;
- **Consentimento** do titular para ativação de ferramentas analíticas e de marketing de terceiros, coletado via banner de cookies e revogável a qualquer momento pelo link "Gerenciar cookies" no rodapé.

## 5. Seus Direitos (art. 18 da LGPD)

Você tem o direito de:

- Confirmar a existência de tratamento de seus dados;
- Acessar seus dados;
- Corrigir dados incompletos, inexatos ou desatualizados;
- Solicitar anonimização, bloqueio ou eliminação de dados desnecessários;
- Revogar o consentimento a qualquer momento;
- Solicitar portabilidade ou informação sobre o uso compartilhado dos seus dados.

Para exercer qualquer desses direitos, escreva para **[EMAIL DE CONTATO]**. Responderemos em até 15 dias úteis.

## 6. Compartilhamento com Terceiros

Dados de analytics são tratados por **Google LLC** conforme a política de privacidade do Google (https://policies.google.com/privacy). Nenhum outro terceiro recebe seus dados.

## 7. Cookies

Utilizamos cookies essenciais (para funcionamento do site) e cookies analíticos (apenas após seu consentimento). Detalhes na nossa [Política de Cookies](/p/politica-de-cookies).

## 8. Segurança

Adotamos medidas razoáveis de segurança técnica e organizacional para proteger os dados tratados. Ainda assim, nenhum sistema é totalmente inviolável — recomendamos que você mantenha seu navegador atualizado.

## 9. Menores de Idade

O site não é direcionado a menores de 13 anos. Não coletamos conscientemente dados de crianças.

## 10. Alterações nesta Política

Podemos atualizar esta política a qualquer momento. A data da última atualização fica indicada no topo da página. Mudanças relevantes serão comunicadas com destaque na página inicial.

## Contato

Dúvidas ou solicitações relacionadas a esta política: **[EMAIL DE CONTATO]**.
`;

const TERMOS = `# Termos de Uso

**Última atualização:** [DATA]

Ao acessar o site **BuscasAmpla** ("site"), você concorda com estes Termos de Uso. Se não concordar com qualquer cláusula, por favor não continue navegando.

## 1. Sobre o Site

O BuscasAmpla é um portal **informativo** que publica rankings, análises e comparativos de produtos disponíveis no varejo brasileiro. Não vendemos produtos diretamente e não somos uma loja virtual.

## 2. Natureza dos Conteúdos

Os rankings, avaliações, notas e recomendações publicadas no site são produzidos a partir de pesquisa em fontes públicas (avaliações de clientes, fichas técnicas de fabricantes, comparativos da imprensa especializada). Representam a **opinião editorial** do site e não substituem seu próprio julgamento ao decidir por uma compra.

## 3. Links de Afiliado

O BuscasAmpla participa de programas de afiliados de lojas parceiras (Amazon, Mercado Livre, Shopee, entre outras). Quando você clica em um link "Comprar agora" e realiza uma compra na loja parceira, o site pode receber uma comissão da própria loja — **sem qualquer custo adicional para você**. Mais detalhes na [Política de Afiliados](/p/politica-de-afiliados).

## 4. Isenção de Responsabilidade

Como o site **não vende** os produtos, não nos responsabilizamos por:

- Preço, disponibilidade em estoque, prazo de entrega, forma de pagamento, garantia ou pós-venda — tudo isso é responsabilidade exclusiva da **loja parceira** para a qual você foi redirecionado;
- Variações de preço entre o momento da publicação do conteúdo e o momento da sua visita;
- Decisões de compra tomadas com base nas informações publicadas.

**Antes de finalizar qualquer compra, confira os termos, condições e informações atualizadas diretamente na loja parceira.**

## 5. Propriedade Intelectual

Todo conteúdo do site (textos, imagens, logotipos, layout) é protegido por direitos autorais. É proibida a reprodução, total ou parcial, sem autorização prévia por escrito. Marcas e logotipos de fabricantes exibidos no site pertencem aos respectivos proprietários e são utilizados apenas para finalidade informativa, sem configurar vínculo comercial.

## 6. Conduta Proibida

Você concorda em não:

- Tentar acessar áreas restritas do site (painel administrativo, APIs internas);
- Executar scraping massivo, ataques automatizados ou tentativas de sobrecarga do servidor;
- Republicar o conteúdo sem autorização prévia por escrito;
- Usar o site para fins ilícitos ou que violem direitos de terceiros.

## 7. Alterações no Conteúdo e nos Termos

Produtos, preços e rankings podem ser atualizados ou removidos a qualquer momento, sem aviso prévio. Estes Termos também podem ser modificados — a versão em vigor é sempre a publicada nesta página.

## 8. Legislação e Foro

Estes Termos são regidos pelas leis do Brasil. Fica eleito o foro da comarca de **[CIDADE/UF]** para dirimir quaisquer controvérsias decorrentes do uso do site.

## Contato

Para dúvidas ou solicitações relacionadas a estes Termos: **[EMAIL DE CONTATO]**.
`;

const COOKIES = `# Política de Cookies

**Última atualização:** [DATA]

Esta Política de Cookies explica como o **BuscasAmpla** utiliza cookies e tecnologias similares.

## 1. O que são cookies

Cookies são pequenos arquivos de texto armazenados no seu navegador quando você visita um site. Eles servem para lembrar informações entre uma visita e outra (preferências, sessão, estatísticas de uso).

## 2. Cookies utilizados pelo BuscasAmpla

### Cookies essenciais

Necessários para o funcionamento do site. Incluem:

- **Preferência de consentimento de cookies**, armazenada no \`localStorage\` do seu navegador com a chave \`bs-consent\`.

Esses dados **não podem ser desativados**, porque sem eles o site não consegue respeitar a sua escolha sobre cookies. Nenhuma informação pessoal é enviada a terceiros através deles — tudo fica no seu próprio navegador.

### Cookies analíticos (opcionais)

Utilizados para medir a audiência e melhorar o conteúdo. São ativados **apenas após o seu consentimento** no banner de cookies:

- **Google Tag Manager / Google Analytics** — identificador de visitante, páginas visitadas, tempo de permanência. Os dados são tratados pela Google LLC conforme a política de privacidade do Google (https://policies.google.com/privacy).

## 3. Como dar ou retirar consentimento

Na sua primeira visita, um banner no canto inferior da tela pergunta se você aceita ou recusa os cookies não essenciais. Sua escolha é guardada no próprio navegador.

Para **mudar de ideia depois**, clique no link **"Gerenciar cookies"** disponível no rodapé de todas as páginas. O banner reaparece e você pode reescolher.

## 4. Como limpar cookies manualmente

Você também pode apagar a preferência de consentimento diretamente no seu navegador:

- **Chrome**: Configurações → Privacidade e segurança → Cookies e outros dados do site → Ver todos os cookies → localizar "buscasampla" → Excluir.
- **Firefox**: Configurações → Privacidade e Segurança → Cookies e dados do site → Gerenciar dados → localizar "buscasampla" → Remover.
- **Safari**: Preferências → Privacidade → Gerenciar dados do site → localizar "buscasampla" → Remover.

## 5. Cookies de terceiros

Se o Google Analytics estiver ativo (porque você consentiu), o Google pode definir seus próprios cookies. Nós não temos controle direto sobre esses cookies — eles seguem a política de privacidade do Google.

## 6. Mais informações

Para detalhes sobre quais dados são coletados e como são utilizados, veja nossa [Política de Privacidade](/p/politica-de-privacidade).

## Contato

Dúvidas sobre esta política: **[EMAIL DE CONTATO]**.
`;

const AFILIADOS = `# Política de Afiliados

**Última atualização:** [DATA]

O **BuscasAmpla** é um site de conteúdo sustentado por programas de afiliados. Esta página explica de forma transparente como isso funciona, para que você saiba exatamente o que esperar ao navegar.

## O que é marketing de afiliados

Marketing de afiliados é um modelo em que um site de conteúdo (como o BuscasAmpla) recomenda produtos e, quando um leitor clica em um link e compra na loja parceira, o site recebe uma **comissão paga pela própria loja** — nunca pelo consumidor.

## Como isso aparece no BuscasAmpla

Quando você vê um botão **"Comprar agora"** ou qualquer link para Amazon, Mercado Livre, Shopee e outras lojas parceiras em nossos rankings e páginas de produto, trata-se de um **link de afiliado**. Se você clicar nele e finalizar uma compra, o BuscasAmpla pode ganhar uma pequena porcentagem da venda.

**Importante:** o preço que você paga é **exatamente o mesmo** que pagaria abrindo a loja diretamente. A comissão sai da margem da loja parceira, não do seu bolso.

## Lojas parceiras ativas

Atualmente, o BuscasAmpla participa dos programas de afiliados de:

- Amazon Brasil (Programa Associados Amazon);
- Mercado Livre (Programa de Afiliados);
- Shopee (Programa Afiliados Shopee);
- KaBuM!;
- Pichau;
- Outros programas conforme disponibilidade.

Esta lista pode ser atualizada sem aviso conforme novas parcerias são firmadas ou encerradas.

## Independência editorial

Nossas recomendações são baseadas em **pesquisa em fontes públicas** (avaliações de clientes, fichas técnicas, comparativos da imprensa especializada) e refletem a opinião editorial do site. Nós **não aceitamos pagamento** de fabricantes para melhorar a posição de um produto em nossos rankings, nem alteramos notas em troca de compensação.

Se uma loja parceira oferecer comissão maior para um produto específico, isso **não** influencia sua colocação no ranking — continuamos usando apenas os critérios técnicos e de avaliação de mercado.

## Conflitos de interesse

Somos conscientes de que existe um conflito de interesse inerente a sites de afiliados: quanto mais você compra, mais ganhamos. Para mitigar esse conflito:

- Incluímos a seção "Contras" em todas as análises de produto;
- Deixamos claro quando um produto não é o ideal para determinado perfil;
- Destacamos alternativas mais baratas sempre que fazem sentido.

## Como nos apoiar

Se o conteúdo do BuscasAmpla te ajudou a decidir uma compra, a melhor forma de apoiar o site é realizar a compra usando um dos nossos links de afiliado. É gratuito para você e sustenta o trabalho de pesquisa e publicação.

## Contato

Dúvidas ou sugestões sobre esta política: **[EMAIL DE CONTATO]**.
`;

const pages: PageSeed[] = [
  {
    slug: "politica-de-privacidade",
    title: "Política de Privacidade",
    metaTitle: "Política de Privacidade — BuscasAmpla",
    metaDesc: "Como a BuscasAmpla coleta, usa e protege dados dos visitantes em conformidade com a LGPD.",
    content: PRIVACIDADE,
  },
  {
    slug: "termos-de-uso",
    title: "Termos de Uso",
    metaTitle: "Termos de Uso — BuscasAmpla",
    metaDesc: "Termos de uso do site BuscasAmpla, natureza do conteúdo e isenção de responsabilidade sobre produtos de lojas parceiras.",
    content: TERMOS,
  },
  {
    slug: "politica-de-cookies",
    title: "Política de Cookies",
    metaTitle: "Política de Cookies — BuscasAmpla",
    metaDesc: "Como o BuscasAmpla utiliza cookies, como dar ou revogar consentimento e quais ferramentas de terceiros são carregadas após aceitação.",
    content: COOKIES,
  },
  {
    slug: "politica-de-afiliados",
    title: "Política de Afiliados",
    metaTitle: "Política de Afiliados — BuscasAmpla",
    metaDesc: "Como o BuscasAmpla ganha comissão por indicações, quais lojas parceiras participam e como a independência editorial é preservada.",
    content: AFILIADOS,
  },
];

async function main() {
  let created = 0;
  let skipped = 0;

  for (const p of pages) {
    const existing = await db.sitePage.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`↻ Já existe, pulando: ${p.slug}`);
      skipped++;
      continue;
    }
    await db.sitePage.create({
      data: {
        slug: p.slug,
        title: p.title,
        metaTitle: p.metaTitle,
        metaDesc: p.metaDesc,
        content: p.content,
        status: "DRAFT",
      },
    });
    console.log(`✓ Criada (DRAFT): ${p.slug}`);
    created++;
  }

  console.log(`\nResumo: ${created} criada(s), ${skipped} já existente(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
```

- [ ] **Step 3.2: Rodar lint**

```bash
npm run lint
```

Expected: sem erros.

- [ ] **Step 3.3: Commit**

```bash
git add scripts/seed-institutional-pages.ts
git commit -m "$(cat <<'EOF'
feat(seed): script idempotente para páginas institucionais

Cria os templates das 4 páginas exigidas pelo compliance pré-Google
Ads (Privacidade, Termos, Cookies, Afiliados) como SitePage DRAFT.
Placeholders [NOME DO RESPONSÁVEL], [EMAIL DE CONTATO], [CIDADE/UF]
e [DATA] para serem preenchidos via admin antes de publicar.
EOF
)"
```

---

## Task 4: Executar o seed e verificar no admin

**Files:** (nenhuma alteração de código — ação operacional)

**Comportamento esperado:**
- Após execução, a tabela `SitePage` contém 5 registros: a "Sobre nós" pré-existente + as 4 novas em DRAFT.
- As 4 páginas novas aparecem listadas em `/admin/paginas`.
- Rodar o script uma segunda vez imprime "4 já existente(s)" e não duplica.

- [ ] **Step 4.1: Executar o seed**

```bash
npx tsx scripts/seed-institutional-pages.ts
```

Expected output:
```
✓ Criada (DRAFT): politica-de-privacidade
✓ Criada (DRAFT): termos-de-uso
✓ Criada (DRAFT): politica-de-cookies
✓ Criada (DRAFT): politica-de-afiliados

Resumo: 4 criada(s), 0 já existente(s).
```

- [ ] **Step 4.2: Verificar idempotência**

Rodar de novo:

```bash
npx tsx scripts/seed-institutional-pages.ts
```

Expected output:
```
↻ Já existe, pulando: politica-de-privacidade
↻ Já existe, pulando: termos-de-uso
↻ Já existe, pulando: politica-de-cookies
↻ Já existe, pulando: politica-de-afiliados

Resumo: 0 criada(s), 4 já existente(s).
```

Se ambas as execuções passaram, a task está verificada. Esta task **não tem commit** — é ação de dados, não de código.

---

## Task 5: Criar componente `AffiliateDisclosure`

**Files:**
- Create: `components/public/AffiliateDisclosure.tsx`

**Comportamento esperado:**
- Componente Server-side puro, sem estado, sem props.
- Renderiza uma `<aside>` cinza-claro com ícone ℹ️, texto de disclosure e link "Saiba mais" para `/p/politica-de-afiliados`.
- Não define `max-width` próprio (fica a cargo do pai que envolve).
- Tem `aria-label` adequado para acessibilidade.

- [ ] **Step 5.1: Criar `components/public/AffiliateDisclosure.tsx`**

Conteúdo completo:

```tsx
import Link from "next/link";

export function AffiliateDisclosure() {
  return (
    <aside
      aria-label="Aviso de afiliado"
      className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600"
    >
      <span aria-hidden="true" className="shrink-0 text-base leading-none pt-0.5">
        ℹ️
      </span>
      <p className="leading-relaxed">
        Alguns links desta página são de afiliados. Se você comprar por eles, podemos receber uma comissão — sem custo extra para você.{" "}
        <Link
          href="/p/politica-de-afiliados"
          className="underline hover:text-blue-600"
        >
          Saiba mais
        </Link>
        .
      </p>
    </aside>
  );
}
```

- [ ] **Step 5.2: Rodar lint**

```bash
npm run lint
```

Expected: sem erros.

- [ ] **Step 5.3: Commit**

```bash
git add components/public/AffiliateDisclosure.tsx
git commit -m "$(cat <<'EOF'
feat(public): novo componente AffiliateDisclosure

Caixa informativa reutilizável para exibir o disclosure de afiliado
no topo das páginas de ranking e produto. Server Component puro,
sem estado, sem max-width próprio (o pai controla o wrap).
EOF
)"
```

---

## Task 6: Inserir `AffiliateDisclosure` nas páginas de ranking e produto

**Files:**
- Modify: `app/(public)/ranking/[slug]/page.tsx` (insere após `</header>`)
- Modify: `app/(public)/produto/[slug]/page.tsx` (insere após o `<nav>` de breadcrumb)

**Comportamento esperado:**
- Ao abrir qualquer `/ranking/[slug]`, a caixa de disclosure aparece logo abaixo do header (com cover/subtitle/h1), antes do bloco `intro`.
- Ao abrir qualquer `/produto/[slug]`, a caixa aparece logo abaixo do breadcrumb, antes do card principal com imagem e CTA.
- O visual geral das páginas não é afetado — só a nova caixa cinza aparece.

- [ ] **Step 6.1: Editar `app/(public)/ranking/[slug]/page.tsx`**

Adicionar import no topo do arquivo (junto com os outros imports):

```tsx
import { AffiliateDisclosure } from "@/components/public/AffiliateDisclosure";
```

Localizar o trecho entre `</header>` (linha ~142) e `{ranking.intro && (` (linha ~145). Inserir o bloco de disclosure entre eles:

**Antes:**
```tsx
      </header>

      {/* Introdução */}
      {ranking.intro && (
```

**Depois:**
```tsx
      </header>

      {/* Disclosure de afiliado */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <AffiliateDisclosure />
      </div>

      {/* Introdução */}
      {ranking.intro && (
```

- [ ] **Step 6.2: Editar `app/(public)/produto/[slug]/page.tsx`**

Adicionar import no topo do arquivo:

```tsx
import { AffiliateDisclosure } from "@/components/public/AffiliateDisclosure";
```

Localizar o trecho entre o `</nav>` do breadcrumb (linha ~79) e o `<div>` do card principal (linha ~82):

**Antes:**
```tsx
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 mb-6">
          {/* ... */}
        </nav>

        {/* Card principal */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
```

**Depois:**
```tsx
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 mb-6">
          {/* ... */}
        </nav>

        {/* Disclosure de afiliado */}
        <div className="mb-6">
          <AffiliateDisclosure />
        </div>

        {/* Card principal */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
```

- [ ] **Step 6.3: Rodar lint**

```bash
npm run lint
```

Expected: sem erros.

- [ ] **Step 6.4: Verificar visualmente**

```bash
npm run dev
```

No navegador:

1. Abrir `http://localhost:3000/ranking/<qualquer-slug-publicado>` → confirmar que a caixa cinza com ícone ℹ️ aparece abaixo do header (após o subtítulo e a imagem de capa), antes do texto de introdução.
2. Abrir `http://localhost:3000/produto/<qualquer-slug-publicado>` → confirmar que a caixa aparece logo abaixo do breadcrumb, antes do card branco com a imagem do produto.
3. Clicar em "Saiba mais" → navega para `/p/politica-de-afiliados` → deve retornar 404 (esperado, porque a página ainda está como DRAFT). O link em si está funcionando — o 404 é responsabilidade da task humana de publicar.

Parar o dev server com Ctrl+C.

- [ ] **Step 6.5: Commit**

```bash
git add app/\(public\)/ranking/\[slug\]/page.tsx app/\(public\)/produto/\[slug\]/page.tsx
git commit -m "$(cat <<'EOF'
feat(public): insere disclosure de afiliado em ranking e produto

Caixa cinza com aviso de afiliado aparece abaixo do header do
ranking (antes da intro) e abaixo do breadcrumb do produto
(antes do card principal). Satisfaz exigência de disclosure
visível do Google Ads e CONAR.
EOF
)"
```

---

## Task 7: Criar helper `lib/cookie-consent.ts`

**Files:**
- Create: `lib/cookie-consent.ts`

**Comportamento esperado:**
- Exporta o tipo `ConsentState = "accepted" | "rejected" | null`.
- Exporta o hook `useCookieConsent()` que:
  - Retorna `{ consent, hasLoaded, accept, reject }`.
  - **SSR-safe**: `consent` inicial é `null` no SSR e no primeiro render do cliente; só lê `localStorage` depois do `useEffect` de montagem, setando `hasLoaded = true`.
  - Reage a eventos customizados `bs:consent-update` (outra aba ou função escreveu) e `bs:consent-reset` (usuário clicou em "Gerenciar cookies").
- Exporta `openCookieBanner()` que limpa a chave `bs-consent` do `localStorage` e dispara `bs:consent-reset` via `window.dispatchEvent`.
- Funciona dentro de try/catch para tolerar modos privados / quota excedida sem explodir.
- Marcado como `"use client"` porque depende de `window`.

- [ ] **Step 7.1: Criar `lib/cookie-consent.ts`**

Conteúdo completo:

```ts
"use client";

import { useEffect, useState } from "react";

export type ConsentState = "accepted" | "rejected" | null;

const STORAGE_KEY = "bs-consent";
const RESET_EVENT = "bs:consent-reset";
const UPDATE_EVENT = "bs:consent-update";

function readStorage(): ConsentState {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "accepted" || v === "rejected" ? v : null;
  } catch {
    return null;
  }
}

function writeStorage(value: ConsentState) {
  if (typeof window === "undefined") return;
  try {
    if (value === null) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, value);
    }
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  } catch {
    // modo privado, quota excedida, etc. — silenciosamente ignora
  }
}

/**
 * Hook reativo para o estado de consentimento de cookies.
 *
 * SSR-safe: durante o primeiro render (server + cliente), retorna
 * `consent: null` e `hasLoaded: false`. Só após o useEffect de
 * montagem é que o localStorage é lido — evitando mismatch de
 * hidratação e flashes do banner em visitantes recorrentes.
 *
 * Consumidores devem tratar `hasLoaded === false` como "carregando"
 * e não renderizar nada (ou um placeholder invisível).
 */
export function useCookieConsent(): {
  consent: ConsentState;
  hasLoaded: boolean;
  accept: () => void;
  reject: () => void;
} {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    setConsent(readStorage());
    setHasLoaded(true);

    const onUpdate = () => setConsent(readStorage());
    const onReset = () => setConsent(null);

    window.addEventListener(UPDATE_EVENT, onUpdate);
    window.addEventListener(RESET_EVENT, onReset);

    return () => {
      window.removeEventListener(UPDATE_EVENT, onUpdate);
      window.removeEventListener(RESET_EVENT, onReset);
    };
  }, []);

  return {
    consent,
    hasLoaded,
    accept: () => writeStorage("accepted"),
    reject: () => writeStorage("rejected"),
  };
}

/**
 * Limpa o consentimento armazenado e dispara o evento de reset,
 * fazendo o CookieBanner reaparecer para o usuário reescolher.
 * Chamado a partir do botão "Gerenciar cookies" no footer.
 */
export function openCookieBanner() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(RESET_EVENT));
}
```

- [ ] **Step 7.2: Rodar lint**

```bash
npm run lint
```

Expected: sem erros.

- [ ] **Step 7.3: Commit**

```bash
git add lib/cookie-consent.ts
git commit -m "$(cat <<'EOF'
feat(lib): hook SSR-safe de cookie consent + helper de reopen

Implementa useCookieConsent (estado reativo com localStorage,
eventos customizados bs:consent-update e bs:consent-reset) e
openCookieBanner (reseta e dispara evento para reabrir banner).
Base do fluxo de consentimento LGPD.
EOF
)"
```

---

## Task 8: Criar componente `CookieBanner`

**Files:**
- Create: `components/public/CookieBanner.tsx`

**Comportamento esperado:**
- Client Component.
- Enquanto o hook não carregou (`!hasLoaded`), retorna `null` (evita flash em visitantes recorrentes).
- Se já há decisão (`consent !== null`), retorna `null` (não mostra).
- Se sem decisão, renderiza um diálogo fixo no canto inferior da viewport, com:
  - Texto curto de consentimento + link para `/p/politica-de-cookies`
  - Dois botões: **Recusar** (cinza) e **Aceitar** (azul, com `autoFocus`)
- Tem `role="dialog"`, `aria-live="polite"`, `aria-label="Consentimento de cookies"`.
- Botão "Aceitar" chama `accept()` (hook), botão "Recusar" chama `reject()`.

- [ ] **Step 8.1: Criar `components/public/CookieBanner.tsx`**

Conteúdo completo:

```tsx
"use client";

import Link from "next/link";
import { useCookieConsent } from "@/lib/cookie-consent";

export function CookieBanner() {
  const { consent, hasLoaded, accept, reject } = useCookieConsent();

  // Não renderiza nada até o estado do localStorage ser lido — evita
  // flash do banner em visitantes recorrentes.
  if (!hasLoaded) return null;

  // Usuário já decidiu em visita anterior.
  if (consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Consentimento de cookies"
      className="fixed inset-x-0 bottom-0 z-50 p-4 md:inset-x-auto md:right-4 md:bottom-4 md:max-w-md"
    >
      <div className="rounded-xl border border-gray-200 bg-white shadow-lg p-5">
        <p className="text-sm text-gray-700 leading-relaxed">
          Usamos cookies para analisar a audiência e melhorar sua experiência. Você pode aceitar ou recusar.{" "}
          <Link
            href="/p/politica-de-cookies"
            className="underline hover:text-blue-600"
          >
            Saiba mais
          </Link>
          .
        </p>
        <div className="mt-4 flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={reject}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={accept}
            autoFocus
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 8.2: Rodar lint**

```bash
npm run lint
```

Expected: sem erros.

- [ ] **Step 8.3: Commit**

```bash
git add components/public/CookieBanner.tsx
git commit -m "$(cat <<'EOF'
feat(public): componente CookieBanner (client, SSR-safe)

Banner fixo no canto inferior (md: caixa à direita / mobile: full-width).
Só aparece se hasLoaded && consent === null. Dois botões (Recusar cinza,
Aceitar azul com autoFocus) consumindo useCookieConsent. role="dialog"
para acessibilidade.
EOF
)"
```

---

## Task 9: Criar componente `GTMGate`

**Files:**
- Create: `components/public/GTMGate.tsx`

**Comportamento esperado:**
- Client Component.
- Recebe `gtmId: string` como prop.
- Enquanto `!hasLoaded` ou `consent !== "accepted"`, retorna `null` — o `<Script>` do GTM **não** é montado.
- Quando `consent === "accepted"`, renderiza `<GTMHead gtmId={gtmId} />` (que reusa o componente existente em `components/public/GoogleTagManager.tsx`).
- Reage dinamicamente: se o usuário aceitar depois (via banner reaberto), o `<GTMHead>` é montado na hora — sem recarregar a página.

- [ ] **Step 9.1: Criar `components/public/GTMGate.tsx`**

Conteúdo completo:

```tsx
"use client";

import { useCookieConsent } from "@/lib/cookie-consent";
import { GTMHead } from "@/components/public/GoogleTagManager";

/**
 * Client wrapper que gateia o GTMHead por consentimento de cookies.
 * Só monta o <Script> do Google Tag Manager depois que o usuário
 * clica "Aceitar" no banner. Satisfaz LGPD Art. 7º + 8º.
 */
export function GTMGate({ gtmId }: { gtmId: string }) {
  const { consent, hasLoaded } = useCookieConsent();

  // Aguarda o hook ler o localStorage — não carrega GTM sem saber a preferência.
  if (!hasLoaded) return null;
  if (consent !== "accepted") return null;

  return <GTMHead gtmId={gtmId} />;
}
```

- [ ] **Step 9.2: Rodar lint**

```bash
npm run lint
```

Expected: sem erros.

- [ ] **Step 9.3: Commit**

```bash
git add components/public/GTMGate.tsx
git commit -m "$(cat <<'EOF'
feat(public): componente GTMGate (gateia GTM por consent)

Client wrapper que só monta GTMHead quando consent === "accepted".
Permite que o GTM seja carregado dinamicamente assim que o usuário
aceita o banner, sem recarregar a página.
EOF
)"
```

---

## Task 10: Integrar `GTMGate` e `CookieBanner` em `app/(public)/layout.tsx`

**Files:**
- Modify: `app/(public)/layout.tsx`

**Comportamento esperado:**
- O layout público passa a renderizar `<CookieBanner />` no final do tree.
- `<GTMHead>` é substituído por `<GTMGate>` — o `GTMNoScript` (fallback noscript) permanece sem alteração.
- Nenhuma regressão no header, footer, ou no conteúdo `{children}`.

- [ ] **Step 10.1: Editar `app/(public)/layout.tsx`**

Substituir o conteúdo completo do arquivo pelo bloco abaixo (as diferenças em relação ao original são: 2 imports novos, troca de `GTMHead` → `GTMGate`, e `<CookieBanner />` antes do `</>`):

```tsx
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { GTMNoScript } from "@/components/public/GoogleTagManager";
import { GTMGate } from "@/components/public/GTMGate";
import { CookieBanner } from "@/components/public/CookieBanner";
import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";

const getCategories = unstable_cache(
  () => db.category.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    select: { id: true, name: true, slug: true },
  }),
  ["public-categories"],
  { revalidate: 300 }
);

const getSettings = unstable_cache(
  () => db.siteSettings.findFirst({ where: { id: "default" } }),
  ["site-settings"],
  { revalidate: 300 }
);

const getPages = unstable_cache(
  () => db.sitePage.findMany({
    where: { status: "PUBLISHED" },
    select: { title: true, slug: true },
    orderBy: { title: "asc" },
  }),
  ["public-pages"],
  { revalidate: 300 }
);

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [categories, settings, pages] = await Promise.all([
    getCategories(),
    getSettings(),
    getPages(),
  ]);

  const gtmId = settings?.gtmId;

  return (
    <>
      {gtmId && <GTMGate gtmId={gtmId} />}
      {gtmId && <GTMNoScript gtmId={gtmId} />}
      <PublicHeader categories={categories} settings={settings} />
      <main className="flex-1">{children}</main>
      <PublicFooter settings={settings} pages={pages} />
      <CookieBanner />
    </>
  );
}
```

- [ ] **Step 10.2: Rodar lint**

```bash
npm run lint
```

Expected: sem erros.

- [ ] **Step 10.3: Verificação rápida no dev server**

```bash
npm run dev
```

Em uma aba **anônima/privada** do navegador (pra garantir `localStorage` limpo):

1. Abrir `http://localhost:3000/` → o banner de cookies deve aparecer no canto inferior.
2. Abrir DevTools (F12) → Network tab → filtrar por `googletagmanager` → **confirmar que nenhuma requisição foi feita** (porque consent ainda é `null`).
3. Clicar em **Recusar** → banner desaparece → ainda nenhuma requisição ao GTM.
4. Recarregar a página → banner **não** reaparece (localStorage tem `rejected`).
5. Limpar localStorage manualmente (DevTools → Application → Storage → Local Storage → remover `bs-consent`) → recarregar → banner reaparece.
6. Clicar em **Aceitar** → banner desaparece → Network tab mostra requisição a `www.googletagmanager.com/gtm.js?id=...`.

Parar o dev server com Ctrl+C.

- [ ] **Step 10.4: Commit**

```bash
git add app/\(public\)/layout.tsx
git commit -m "$(cat <<'EOF'
feat(layout): gateia GTM por consent e monta CookieBanner

Substitui GTMHead por GTMGate (gating dinâmico por useCookieConsent)
e monta CookieBanner ao final do layout público. GTMNoScript
(fallback noscript) permanece inalterado.
EOF
)"
```

---

## Task 11: `ManageCookiesButton` + integração no `PublicFooter`

**Files:**
- Create: `components/public/ManageCookiesButton.tsx`
- Modify: `components/public/PublicFooter.tsx`

**Comportamento esperado:**
- O footer passa a ter um botão "Gerenciar cookies" ao final do `<nav>`, com estilo idêntico aos links existentes (mesma classe de hover).
- Clicar nele dispara `openCookieBanner()` → o banner reaparece imediatamente (mesmo que o usuário já tenha decidido antes).
- O `<nav>` ganha `flex-wrap` para não quebrar visualmente quando as 4 páginas institucionais novas forem publicadas e somarem junto com "Categorias" + "Gerenciar cookies" (6+ itens).
- `PublicFooter` continua sendo Server Component — o botão é um micro Client Component separado.

- [ ] **Step 11.1: Criar `components/public/ManageCookiesButton.tsx`**

Conteúdo completo:

```tsx
"use client";

import { openCookieBanner } from "@/lib/cookie-consent";

export function ManageCookiesButton() {
  return (
    <button
      type="button"
      onClick={openCookieBanner}
      className="hover:text-blue-600 transition-colors"
    >
      Gerenciar cookies
    </button>
  );
}
```

- [ ] **Step 11.2: Editar `components/public/PublicFooter.tsx`**

Adicionar o import no topo do arquivo (junto com o `import Link from "next/link"`):

```tsx
import { ManageCookiesButton } from "@/components/public/ManageCookiesButton";
```

Localizar o `<nav>` interno (linhas ~34-41) e substituí-lo pelo novo:

**Antes:**
```tsx
          <nav className="flex gap-4 text-xs">
            <Link href="/categorias" className="hover:text-blue-600">Categorias</Link>
            {pages.map((page) => (
              <Link key={page.slug} href={`/p/${page.slug}`} className="hover:text-blue-600">
                {page.title}
              </Link>
            ))}
          </nav>
```

**Depois:**
```tsx
          <nav className="flex flex-wrap gap-4 text-xs">
            <Link href="/categorias" className="hover:text-blue-600">Categorias</Link>
            {pages.map((page) => (
              <Link key={page.slug} href={`/p/${page.slug}`} className="hover:text-blue-600">
                {page.title}
              </Link>
            ))}
            <ManageCookiesButton />
          </nav>
```

Mudanças: `flex` → `flex flex-wrap`, e `<ManageCookiesButton />` adicionado após o `.map`.

- [ ] **Step 11.3: Rodar lint**

```bash
npm run lint
```

Expected: sem erros.

- [ ] **Step 11.4: Verificação rápida**

```bash
npm run dev
```

Navegador (anônimo):

1. Abrir `http://localhost:3000/` → aceitar o banner (ou recusar).
2. Rolar até o rodapé → confirmar que "Gerenciar cookies" aparece na navegação do footer, junto com "Categorias" e a página "Sobre nós".
3. Clicar em "Gerenciar cookies" → o banner deve reaparecer no canto inferior.
4. Clicar em "Aceitar" ou "Recusar" de novo → banner some, estado atualiza.

Parar o dev server com Ctrl+C.

- [ ] **Step 11.5: Commit**

```bash
git add components/public/ManageCookiesButton.tsx components/public/PublicFooter.tsx
git commit -m "$(cat <<'EOF'
feat(footer): botão 'Gerenciar cookies' para revogar consentimento

Novo micro Client Component ManageCookiesButton dispara
openCookieBanner(). PublicFooter ganha o botão ao final do nav
e muda de flex para flex-wrap para suportar os itens extras
(categorias + 4 políticas + gerenciar cookies).
LGPD Art. 8º §5º (revogação facilitada).
EOF
)"
```

---

## Task 12: Smoke test completo + build final

**Files:** (nenhuma alteração — verificação integral)

**Comportamento esperado:**
- `npm run build` conclui sem erros de TypeScript nem de Next.js.
- Todos os 5 grupos de smoke test do spec passam.

- [ ] **Step 12.1: Build de produção**

```bash
npm run build
```

Expected: build conclui com sucesso, sem erros. Warnings sobre `<img>` vs `<Image>` são pré-existentes e aceitáveis (fora do escopo desta entrega).

- [ ] **Step 12.2: Smoke test — Banner de cookies**

```bash
npm run dev
```

Em aba **anônima** do navegador:

1. Limpar qualquer storage pré-existente (DevTools → Application → Storage → Clear site data).
2. Abrir `http://localhost:3000/` → **o banner aparece** no canto inferior.
3. Abrir DevTools Network tab, filtrar por `googletagmanager` → **zero requisições** até aqui.
4. Clicar em **Recusar** → banner desaparece → ainda **zero requisições** a `googletagmanager`.
5. Recarregar (F5) → banner **não** aparece de novo (estado `rejected` persistido).
6. Rolar até o footer → clicar em **"Gerenciar cookies"** → banner reaparece.
7. Clicar em **Aceitar** → banner desaparece → Network tab mostra requisição nova para `www.googletagmanager.com/gtm.js?id=...`.

Se tudo passou, ✅ grupo 1 ok.

- [ ] **Step 12.3: Smoke test — Disclosure**

Ainda no dev server:

1. Abrir `http://localhost:3000/ranking/<qualquer-slug-publicado>` → **caixa cinza de disclosure aparece** logo após o header do ranking, antes da introdução.
2. Abrir `http://localhost:3000/produto/<qualquer-slug-publicado>` → **caixa cinza aparece** logo após o breadcrumb, antes do card principal.
3. Clicar em "Saiba mais" em qualquer uma → retorna 404 porque `politica-de-afiliados` ainda está DRAFT. Isso é **esperado e aceitável** — o link está correto.

Se o 404 confirma que o link está apontando para `/p/politica-de-afiliados`, ✅ grupo 2 ok.

- [ ] **Step 12.4: Smoke test — Páginas institucionais**

1. Abrir `http://localhost:3000/admin` → fazer login (usuário padrão do seed: `admin@admin.com` / `admin123`, ou as credenciais que você tiver usado no seu `.env` via `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`).
2. Abrir `http://localhost:3000/admin/paginas` → **5 páginas listadas** (a "Sobre nós" pré-existente + 4 novas em DRAFT).
3. (Opcional — ação humana) Abrir cada uma das 4 políticas novas, substituir `[NOME DO RESPONSÁVEL]`, `[EMAIL DE CONTATO]`, `[CIDADE/UF]` e `[DATA]` pelos valores reais, mudar para PUBLISHED e salvar.
4. Depois de publicar, abrir o footer de qualquer página pública → as 4 páginas aparecem **automaticamente** como links novos.

Se o passo 2 confirma as 5 páginas, ✅ grupo 3 ok (passos 3-4 são ação humana posterior, não bloqueiam a conclusão da task).

- [ ] **Step 12.5: Smoke test — Headers**

Com o dev server ainda rodando, em outro terminal:

```bash
curl -sI http://localhost:3000/ | grep -Ei "strict-transport|permissions-policy|x-frame-options|x-content-type|referrer-policy"
```

Expected: 5 linhas, incluindo as 2 novas:
```
strict-transport-security: max-age=63072000; includeSubDomains; preload
permissions-policy: camera=(), microphone=(), geolocation=(), payment=()
```

Se os 5 headers aparecem, ✅ grupo 4 ok.

- [ ] **Step 12.6: Smoke test — `rel` em links afiliados**

Com o dev server ainda rodando, no navegador:

1. Abrir qualquer `/ranking/<slug>` → botão direito no "Comprar agora" → Inspecionar → confirmar `rel="noopener noreferrer sponsored nofollow"` e `target="_blank"`.
2. Abrir `/linksdireto` → se houver links renderizados, inspecionar um e confirmar `rel="noopener noreferrer sponsored nofollow"`. Se não houver links (manualLinks vazio), pular este sub-passo.

Se os `rel` estão corretos, ✅ grupo 5 ok.

Parar o dev server com Ctrl+C.

- [ ] **Step 12.7: Commit de fechamento (vazio, marca o fim da entrega)**

Como a task 12 é só verificação, **não há commit de código**. Em vez disso, anotar no `MEMORY.md` do sub-projeto que ele foi concluído. Mas como o plano não inclui manutenção de MEMORY.md, o fechamento é apenas uma confirmação verbal: "Task 12 verificada, sub-projeto A concluído."

---

## Pós-implementação (ação humana)

Após a execução completa deste plano, o código está pronto. Restam 2 ações humanas antes de ativar o Google Ads:

1. **Preencher os placeholders nas 4 páginas institucionais:**
   - Abrir `/admin/paginas` logado como admin.
   - Para cada uma das 4 políticas: substituir `[NOME DO RESPONSÁVEL]`, `[EMAIL DE CONTATO]`, `[CIDADE/UF]` e `[DATA]` pelos valores reais.
   - Mudar o status de DRAFT para PUBLISHED.
   - Salvar.

2. **Verificar o footer em produção:** abrir o site em produção e confirmar que os 4 links novos aparecem no rodapé automaticamente.

Após essas 2 ações, o site está **conformidade-ready** para o Google Ads.

---

## Itens deliberadamente fora do escopo

Conforme decidido no brainstorming, os seguintes itens **não** fazem parte deste plano e ficam como backlog para sub-projetos futuros:

- Google Consent Mode v2 (sub-projeto B candidato — perda estimada de 5–15% de atribuição em campanhas)
- Content-Security-Policy (proteção XSS adicional, complexidade de compatibilidade com GTM)
- Banner de cookies granular por categoria
- Links das políticas no menu/header (só footer)
- Página `/p/cookies` com controles avançados de gerenciamento
- Todos os outros sub-projetos identificados no brainstorming inicial (B: SEO estrutural, C: selos automáticos, D: estratégia de Google Ads, E: docs de status de produtos)
