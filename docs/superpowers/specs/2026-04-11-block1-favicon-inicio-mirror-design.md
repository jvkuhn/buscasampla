# Block 1 — Favicon + `/inicio` Mirror

**Date:** 2026-04-11
**Status:** Approved for implementation
**Driver:** User precisa subir atualizações rápido para testar campanha Google Ads já configurada.

## Context

O usuário está lançando campanha Google Ads apontando para `https://buscasampla.com.br/inicio`. Essa URL ainda não existe. Também quer o favicon trocado de um ícone genérico antigo para o logo "A" em fundo azul (`app/ampla.jpg`).

Este é o primeiro de três blocos. Blocos 2 (SEO estrutural + selos automáticos) e 3 (docs de status de produtos) serão brainstormados separadamente depois que o usuário testar o anúncio.

## Non-Goals

- Landing page dedicada para Ads (opção C no brainstorming) — fica para bloco futuro, se o usuário quiser.
- Otimização de conversão em código — fora de escopo porque o conteúdo de `/inicio` é idêntico ao de `/`.
- Mudanças de metadata fora do mínimo necessário pro canonical funcionar.
- Tarefas B, C, E do backlog inicial.

## Design

### 1. Favicon

**Problema:** `app/favicon.ico` é o ícone padrão antigo do Next.js. `app/ampla.jpg` existe no diretório mas não é reconhecido pelo App Router porque não segue a convenção de nome `icon.{ext}`.

**Solução:**
1. Renomear `app/ampla.jpg` → `app/icon.jpg`.
   - Next.js 16 detecta arquivos `app/icon.{ico,jpg,jpeg,png,svg}` automaticamente e injeta `<link rel="icon" href="/icon.jpg?<hash>">` no `<head>` de todas as páginas, com hashing de cache.
2. Deletar `app/favicon.ico`.
   - Navegadores modernos usam o `<link rel="icon">` gerado; não há regressão observável.
   - Ao deletar, garantimos que o favicon antigo não continua servido no endpoint legado `/favicon.ico`.

**Trade-off conhecido:** não vamos gerar um ICO multi-size. Se precisar no futuro (ex: exigência de algum validador), geramos depois — não é bloqueador.

### 2. `/inicio` Mirror da Home

**Problema:** Duplicar o componente `HomePage` em duas páginas cria débito técnico imediato.

**Solução:** Extrair o corpo atual de `app/(public)/page.tsx` para um server component compartilhado.

**Arquivos afetados:**

- **Novo:** `components/public/HomePageContent.tsx`
  - Async server component sem props.
  - Contém toda a lógica atual de `app/(public)/page.tsx` (4 queries Prisma, JSON-LD, renderização).
  - Exporta como default.

- **Modificado:** `app/(public)/page.tsx`
  - Vira um one-liner: `export { default } from "@/components/public/HomePageContent"` (ou equivalente).
  - Mantém `export const dynamic = "force-dynamic"`.
  - Não define metadata (herda do root layout como hoje).

- **Novo:** `app/(public)/inicio/page.tsx`
  - Renderiza o mesmo `HomePageContent`.
  - Mantém `export const dynamic = "force-dynamic"`.
  - Exporta `metadata` com `alternates: { canonical: "/" }` para dizer ao Google que `/` é a versão oficial.

- **Modificado:** `app/sitemap.ts`
  - **Não incluir** `/inicio` no sitemap. Razão: já há canonical apontando para `/`. Listar o espelho gera ruído no Search Console.

- **Não modificado:** `app/robots.ts`
  - `/inicio` permanece crawlable (não deve ser bloqueado; o Ads precisa poder acessá-lo). Só está fora do sitemap.

### 3. Conversão em Google Ads — Recomendação (fora do código)

Dentro do escopo "espelho da home", não há mudança de código que ajude conversão além do que já existe. Recomendação para o usuário aplicar no painel Google Ads:

- **Final URL da campanha:** `https://buscasampla.com.br/inicio?utm_source=google&utm_medium=cpc&utm_campaign=<nome_da_campanha>`
- Isso permite medir em GA4/GTM a conversão de tráfego pago separadamente do orgânico.
- O GTM já está gated por consent (cookie banner). Se o usuário arriver do Ads e não aceitar cookies, a conversão **não será trackeada pelo GTM** — isso é conformidade LGPD e não vamos contornar.

## Testing

Sem suíte de testes no projeto. Verificações manuais após implementação:

- [ ] Build roda sem erro: `npm run build`
- [ ] `/` renderiza home corretamente em dev
- [ ] `/inicio` renderiza home corretamente em dev
- [ ] View-source em `/inicio` mostra `<link rel="canonical" href=".../">`
- [ ] View-source em `/` e `/inicio` mostra `<link rel="icon" href="/icon.jpg?...">`
- [ ] `/sitemap.xml` **não** lista `/inicio`
- [ ] `/favicon.ico` não serve o antigo (404 ou serve o novo — ambos aceitáveis)
- [ ] Ícone aparece na tab do navegador

## Ship

Após validação local, commit + push automático para `main` (preferência do usuário registrada em memória).
