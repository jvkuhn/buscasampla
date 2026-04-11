# Compliance pré-Google Ads — Design

**Data:** 2026-04-11
**Sub-projeto:** A (primeiro dos 5 sub-projetos identificados no brainstorming inicial)
**Status:** Design aprovado pelo usuário, aguardando escrita do plano de implementação

---

## Contexto e motivação

O projeto BuscasAmpla tem 430 produtos e 43 rankings publicados. O próximo passo de negócio é rodar **Google Ads** para impulsionar tráfego. Antes disso, o site precisa atender requisitos mínimos de:

- **LGPD** (Lei Geral de Proteção de Dados — Brasil)
- **Políticas do Google Ads** (em especial "representação enganosa" para sites de afiliado)
- **Boas práticas de SEO e segurança** que o Google Ads usa como sinal de qualidade

Sem esses requisitos, o Google Ads pode reprovar os anúncios na revisão inicial ou suspender a conta depois de ativa. Este sub-projeto entrega o conjunto **mínimo suficiente** para passar nessas revisões sem comprometer a funcionalidade nem o visual atual do site.

O usuário escolheu explicitamente a **abordagem de mínimo suficiente** (equivalente à "Abordagem 1" do brainstorming), com uma correção técnica obrigatória: a LGPD Art. 8º §5º exige que o consentimento seja **revogável a qualquer momento**, então o banner de cookies precisa poder ser reaberto (implementado via link "Gerenciar cookies" no footer).

Itens conscientemente **fora do escopo** desta entrega: Google Consent Mode v2, Content-Security-Policy, banner de cookies granular por categoria, links das políticas no menu/header. Todos ficam como backlog potencial.

---

## Estado relevante do código (levantado antes do design)

- **`components/public/AffiliateLink.tsx`**: já renderiza `<a>` com `rel="noopener noreferrer sponsored nofollow"` e `target="_blank"`. **Não precisa alteração.**
- **`components/public/PublicFooter.tsx`**: recebe `pages` como prop e já renderiza todas as `SitePage` publicadas como links `/p/{slug}`. Significa que criar as 4 páginas no banco e marcá-las como PUBLISHED faz elas aparecerem sozinhas no footer.
- **`app/(public)/layout.tsx`**: carrega o GTM através de `GTMHead` / `GTMNoScript` condicionalmente se `settings.gtmId` existir. O componente está em `components/public/GoogleTagManager.tsx`. Hoje é Server Component, dispara o GTM incondicionalmente quando o `gtmId` está definido.
- **`app/linksdireto/page.tsx`**: renderiza `<a>` manualmente a partir de `settings.manualLinks` (JSON). Os `rel` hoje são `noopener noreferrer` — faltam `sponsored nofollow`. A página já tem `robots: { index: false, follow: false }`, mas a correção é trivial.
- **`next.config.ts`**: já tem 3 headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`). Faltam `Strict-Transport-Security` e `Permissions-Policy`.
- **Tabela `SitePage`** tem apenas 1 registro hoje: `{ slug: "sobre", title: "Sobre nós", status: "PUBLISHED" }`. As 4 páginas novas vão ser criadas como `DRAFT`.
- **`settings.affiliateNotice`** existe e já aparece no topo do `PublicFooter`. Não é removido — fica lá como reforço — mas o disclosure visível fica por conta de um componente novo **dentro do conteúdo** das páginas de ranking/produto.

---

## Escopo da entrega

### 1. Quatro páginas institucionais (DRAFT)

Criadas via script idempotente `scripts/seed-institutional-pages.ts` executado uma vez com `tsx`. As 4 páginas são inseridas na tabela `SitePage` em `status: DRAFT` se o slug ainda não existir. Rodar o script de novo não duplica nem sobrescreve.

Slugs e títulos:

1. **`politica-de-privacidade`** — "Política de Privacidade"
2. **`termos-de-uso`** — "Termos de Uso"
3. **`politica-de-cookies`** — "Política de Cookies"
4. **`politica-de-afiliados`** — "Política de Afiliados"

Cada página recebe um template em português baseado nos requisitos da LGPD para sites de conteúdo + afiliado. Os campos de identificação do controlador são deixados como **placeholders explícitos**:

- `[NOME DO RESPONSÁVEL]`
- `[EMAIL DE CONTATO]`
- `[CIDADE/UF]`

O usuário substitui esses placeholders via admin (`/admin/paginas/{id}`) antes de marcar como `PUBLISHED`. Isso é proposital: mantém a pessoa física identificável (escolha da pergunta 1 do brainstorming) sem forçar dados sensíveis no código-fonte do repositório.

**Conteúdo dos 4 templates** (resumo do que cada um cobre — os textos completos serão definidos na fase de implementação do plano):

- **Privacidade**: identificação do controlador, dados coletados (nenhum cadastro público; apenas cookies de terceiros de analytics), finalidade, base legal (legítimo interesse + consentimento para marketing), direitos do titular (art. 18 LGPD), como exercê-los (e-mail de contato), prazo de guarda, compartilhamento com terceiros (Google), cookies, menores, alterações.
- **Termos de Uso**: natureza informativa do site, ausência de relação comercial direta com o usuário, isenção de responsabilidade sobre preço/estoque/qualidade/prazo/garantia dos produtos das lojas parceiras, propriedade intelectual do conteúdo, conduta proibida, foro brasileiro, alterações.
- **Cookies**: o que são cookies, tipos usados no site (essenciais de sessão, analíticos via Google Tag Manager/Analytics), como recusar (banner + link "gerenciar cookies" no footer), como limpar (instruções sucintas por navegador), cookies de terceiros.
- **Afiliados**: declaração de que o site participa de programas de afiliados (Amazon, Mercado Livre, etc.), que ganha comissão quando o visitante compra por links marcados, que isso não aumenta o preço para o consumidor, independência editorial das recomendações, transparência quanto ao conflito de interesse.

Todas em tom acessível mas formal, 400–800 palavras cada, consistentes com a marca "BuscasAmpla".

### 2. Banner de consentimento de cookies

**Componente novo:** `components/public/CookieBanner.tsx` — **Client Component**.

**Componente novo (helper):** `lib/cookie-consent.ts` — exporta:
- `type ConsentState = "accepted" | "rejected" | null`
- `useCookieConsent()` — React hook que lê/escreve `localStorage` com a chave `bs-consent` e expõe estado reativo. **Obrigatoriamente SSR-safe**: o valor inicial do estado é `null` tanto no servidor quanto no primeiro render do cliente, e só após o `useEffect` de montagem o hook lê `localStorage` e atualiza. Isso evita mismatch de hidratação e flashes do banner. O `CookieBanner` consumidor precisa lidar com o estado "carregando" (não renderizar nada até o primeiro efeito rodar).
- `openCookieBanner()` — função que limpa o `localStorage` e dispara um evento customizado (`bs:consent-reset`) que o `CookieBanner` escuta via `window.addEventListener` para reaparecer.

**Comportamento:**

- Primeiro acesso do visitante (`localStorage.bs-consent === null`): o banner aparece como faixa fixa no canto inferior da viewport, largura quase total em mobile e caixa arredondada em desktop. Fundo branco com sombra, borda sutil, padding confortável.
- Texto curto: *"Usamos cookies para analisar a audiência e melhorar sua experiência. Você pode aceitar ou recusar. [Saiba mais](/p/politica-de-cookies)"*
- Dois botões: **Recusar** (secundário, cinza claro — `bg-gray-100 hover:bg-gray-200 text-gray-700`) e **Aceitar** (primário, na paleta azul usada pelos links do site — `bg-blue-600 hover:bg-blue-700 text-white`).
- Clicar em "Aceitar" → `localStorage.bs-consent = "accepted"`, banner desaparece, GTM carrega.
- Clicar em "Recusar" → `localStorage.bs-consent = "rejected"`, banner desaparece, GTM **não** carrega.
- Visitantes recorrentes: banner não aparece. Estado é lido de `localStorage` e respeitado.
- Se o usuário clicar no botão "Gerenciar cookies" no footer, `openCookieBanner()` limpa o estado e dispara o evento. O banner reaparece. Ele escolhe de novo.

**Acessibilidade:**
- Banner renderizado com `role="dialog"`, `aria-live="polite"`, `aria-label="Consentimento de cookies"`.
- Botões com labels claras. Foco inicial no botão "Aceitar".
- Banner pode ser navegado por teclado (Tab, Enter). Não bloqueia o scroll da página.

### 3. Gating do GTM por consentimento

Hoje `app/(public)/layout.tsx` renderiza `<GTMHead gtmId={gtmId} />` e `<GTMNoScript gtmId={gtmId} />` incondicionalmente quando `settings.gtmId` está definido. Isso viola a LGPD: o GTM é carregado antes do usuário consentir.

**Mudança:**

1. `GTMHead` passa a ser renderizado dentro de um novo Client Component `components/public/GTMGate.tsx` que:
   - Usa `useCookieConsent()` para ler o estado.
   - Só renderiza o `<Script>` do GTM quando o estado é `"accepted"`.
   - Reagindo à mudança de estado (aceitar após recusar, ou re-aceitar após revogação), monta o `<Script>` dinamicamente.
2. `GTMNoScript` (que é o `<iframe>` de fallback para usuários sem JS) permanece renderizado sempre que `gtmId` existir. **Justificativa:** sem JS, não há banner e não há como guardar consentimento; o Google recomenda que o fallback de `<noscript>` permaneça para não quebrar o GTM Server-Side. Sem JS, não dá para rastrear o clique em "Aceitar" de qualquer jeito, e o Google trata esses hits separadamente. A prevalência de navegadores sem JS hoje é < 0.1%, e o risco LGPD marginal é aceitável dentro do mínimo viável.

Isso significa alterar `app/(public)/layout.tsx` para:

```tsx
{gtmId && <GTMGate gtmId={gtmId} />}
{gtmId && <GTMNoScript gtmId={gtmId} />}
```

O `GTMHead` original continua exportado para o `GTMGate` usar internamente. O `GTMNoScript` permanece como Server Component.

### 4. Caixa de disclosure de afiliado

**Componente novo:** `components/public/AffiliateDisclosure.tsx` — **Server Component**, sem estado, sem props (texto fixo).

**Visual:**
- Caixa com fundo `bg-gray-50`, borda `border border-gray-200`, cantos arredondados `rounded-xl`, padding confortável.
- Ícone pequeno (emoji ℹ️ ou SVG simples) à esquerda.
- Texto: *"Alguns links desta página são de afiliados. Se você comprar por eles, podemos receber uma comissão — sem custo extra para você. [Saiba mais](/p/politica-de-afiliados)"*
- Tipografia pequena (`text-xs` ou `text-sm`), cor neutra (`text-gray-600`).
- Espaçamento vertical que não cole no elemento acima nem no de baixo.

**Onde aparece:**
- `app/(public)/ranking/[slug]/page.tsx` — inserido logo abaixo do `subtitle` do header do ranking, antes do `intro` (ou seja, no topo do conteúdo, acima da dobra em desktop).
- `app/(public)/produto/[slug]/page.tsx` — inserido logo abaixo do H1 do produto, antes do card principal com imagem e CTA.

**Não aparece em:** home, categorias (index e detalhe), busca, linksdireto, páginas institucionais. Justificativa: nessas páginas o "conteúdo" não contém links afiliados diretos (home/categorias apontam para rankings que têm o disclosure; busca é ferramenta; linksdireto é private/noindex).

### 5. Auditoria e correção de `rel` em links externos

**Estado levantado:**
- `components/public/AffiliateLink.tsx`: ✅ já correto (`rel="noopener noreferrer sponsored nofollow"`).
- `app/linksdireto/page.tsx`: ❌ `rel="noopener noreferrer"` — falta `sponsored nofollow`.

**Ação:** editar `app/linksdireto/page.tsx` para usar `rel="noopener noreferrer sponsored nofollow"` na tag `<a>` dentro do `links.map(...)`.

**Sweep adicional:** durante a implementação, executar um grep ampliado por tags `<a>` no codebase para detectar qualquer outro lugar que possa estar renderizando link externo sem o `rel` correto. Rankings, produto e cards usam `next/link` internamente (seguro) ou delegam para `AffiliateLink` (seguro). A hipótese é que `linksdireto` seja o único caso extra.

### 6. Headers de segurança adicionais

Alterar `next.config.ts`, função `headers()`, adicionando ao array atual:

```ts
{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
```

**Justificativa:**
- **HSTS**: obriga o navegador a usar HTTPS por 2 anos (63072000 segundos), incluindo subdomínios. Flag `preload` torna o site elegível para inclusão futura na lista de preload do Chromium. Valor padrão recomendado por Mozilla Observatory e Google.
- **Permissions-Policy**: desabilita explicitamente as 4 APIs sensíveis que o site não usa. Defesa em profundidade contra XSS: mesmo que um script malicioso seja injetado, ele não consegue pedir a câmera, o microfone, a geolocalização ou a API de pagamento do usuário.

**Não incluído:**
- **CSP (Content-Security-Policy)**: ganho de segurança real, mas precisa de auditoria cuidadosa contra o GTM (que injeta scripts de vários domínios) e carrega risco concreto de quebrar tracking em produção. Decisão consciente de deixar para depois.

### 7. Link "Gerenciar cookies" no footer

**Alteração em `components/public/PublicFooter.tsx`:**

Dentro do `<nav>` que já lista `Categorias` + páginas publicadas, adicionar um **botão** (não link) no final, com o texto "Gerenciar cookies". Visual idêntico aos outros itens do nav (mesma classe, mesma cor, mesmo hover). É um `<button>` porque o comportamento é JavaScript (`openCookieBanner()`), não navegação.

Para chamar `openCookieBanner()` do lado cliente dentro de um Server Component como é o `PublicFooter`, a alternativa mais limpa é criar um mini Client Component `components/public/ManageCookiesButton.tsx` que o Footer importa e renderiza no lugar. Mantém o Footer como Server Component.

**Importante:** as 4 páginas institucionais novas aparecem **automaticamente** no footer assim que forem marcadas como `PUBLISHED` no admin — porque `PublicFooter` já recebe `pages` do layout e mapeia todas. Nenhuma alteração extra é necessária nesse ponto.

---

## Arquivos afetados (resumo)

**Novos:**
- `docs/superpowers/specs/2026-04-11-compliance-pre-google-ads-design.md` (este arquivo)
- `scripts/seed-institutional-pages.ts` — script one-shot idempotente
- `components/public/CookieBanner.tsx` — Client Component
- `components/public/AffiliateDisclosure.tsx` — Server Component
- `components/public/GTMGate.tsx` — Client Component wrapper
- `components/public/ManageCookiesButton.tsx` — Client Component micro
- `lib/cookie-consent.ts` — hook + helper + evento

**Alterados:**
- `next.config.ts` — 2 headers novos
- `app/(public)/layout.tsx` — troca `GTMHead` por `GTMGate`
- `app/(public)/ranking/[slug]/page.tsx` — insere `<AffiliateDisclosure />`
- `app/(public)/produto/[slug]/page.tsx` — insere `<AffiliateDisclosure />`
- `components/public/PublicFooter.tsx` — adiciona `<ManageCookiesButton />`
- `app/linksdireto/page.tsx` — corrige `rel` do `<a>`

**Intocados (verificados):**
- `components/public/AffiliateLink.tsx` — já tem `rel` correto
- `components/public/GoogleTagManager.tsx` — `GTMHead` é reusado dentro de `GTMGate`; `GTMNoScript` permanece como está
- Schema Prisma — nenhuma migração
- `prisma/seed.ts` — não alterar para não misturar seed de institucionais com seed demo

---

## Comportamento esperado (critérios de aceitação)

Smoke test manual (que roda no final da implementação):

1. **Banner de cookies**
   - Abrir home em aba anônima → banner aparece no canto inferior.
   - Clicar em "Recusar" → banner desaparece → DevTools Network tab não mostra requisições para `googletagmanager.com`.
   - Recarregar → banner não aparece de novo.
   - Clicar em "Gerenciar cookies" no footer → banner volta.
   - Clicar em "Aceitar" → banner desaparece → DevTools Network mostra o `gtm.js` carregando.
2. **Disclosure**
   - Abrir `/ranking/{qualquer-slug}` → caixa de disclosure aparece abaixo do subtítulo, acima da dobra.
   - Abrir `/produto/{qualquer-slug}` → caixa de disclosure aparece abaixo do H1 do produto.
   - Clicar no "Saiba mais" do disclosure → navega para `/p/politica-de-afiliados` (desde que a página tenha sido publicada; enquanto estiver DRAFT, 404).
3. **Páginas institucionais**
   - Rodar `npx tsx scripts/seed-institutional-pages.ts` → 4 registros novos em `SitePage` com `status: DRAFT`.
   - Abrir `/admin/paginas` → 5 páginas listadas (a "Sobre nós" pré-existente + as 4 novas).
   - Abrir cada uma, substituir `[NOME DO RESPONSÁVEL]`, `[EMAIL DE CONTATO]`, `[CIDADE/UF]` pelos valores reais, mudar status para PUBLISHED, salvar.
   - Abrir o footer de qualquer página pública → 4 links novos aparecem automaticamente.
4. **Headers**
   - `curl -I https://{seu-dominio}` ou DevTools Network → resposta inclui `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` e `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`.
5. **`rel` correto**
   - Abrir qualquer ranking → clicar com botão direito em qualquer botão "Comprar agora" → inspecionar → `rel="noopener noreferrer sponsored nofollow"` e `target="_blank"`.
   - Abrir `/linksdireto` → inspecionar qualquer link → `rel="noopener noreferrer sponsored nofollow"`.

---

## Impactos conhecidos / não-objetivos

- **Tracking de visitantes que recusam cookies:** fica zero após implementação. Isso é intencional e correto (LGPD). Sem Consent Mode v2, o Google Ads também não vai modelar essas conversões. Perda estimada de atribuição: 5–15% dos visitantes. Esse é o trade-off consciente da abordagem mínima.
- **`affiliateNotice` no `SiteSettings`:** permanece exibido no topo do footer como hoje. Não é removido — o disclosure dentro do conteúdo é **adicional**, não substituto.
- **Páginas admin:** não são afetadas. O GTM já não carrega em `/admin/*` (só está em `app/(public)/layout.tsx`). O banner de cookies também não aparece em admin — a decisão é intencional porque o admin é logado e não representa público.
- **`/linksdireto`:** é `robots: noindex, nofollow` e listado em `robots.txt disallow`. O banner de cookies **não aparece** nela, porque ela não está sob `app/(public)/layout.tsx` e não precisa ser parte do fluxo LGPD (é uma landing privada). O fix do `rel` é apenas defesa em profundidade.

---

## Dependências e pré-requisitos

- Nenhuma dependência npm nova.
- Nenhuma migração de banco.
- Nenhuma variável de ambiente nova.
- Pré-requisito humano: usuário precisa substituir os 3 placeholders nas 4 páginas institucionais via admin **antes** de ativar o Google Ads.

---

## Próximos passos após aprovação deste design

1. Self-review inline deste documento (pela IA)
2. Usuário revisa o arquivo em `docs/superpowers/specs/2026-04-11-compliance-pre-google-ads-design.md`
3. Após aprovação do usuário, invocar skill `superpowers:writing-plans` para gerar o plano de implementação passo-a-passo
4. Execução do plano
