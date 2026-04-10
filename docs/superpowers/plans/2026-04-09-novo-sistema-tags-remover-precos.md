# Novo Sistema de Tags + Remover Preços da UI — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o enum Badge por 6 novas tags brasileiras e remover exibição de preços da UI pública.

**Architecture:** Migration Prisma para alterar o enum Badge, atualizar constants/validações, remover preços dos componentes públicos (RankingItem e página de produto), atualizar formulário admin com novas opções.

**Tech Stack:** Prisma 6, Next.js 16, Zod 4, Tailwind CSS 4

---

### Task 1: Prisma Migration — Alterar enum Badge

**Files:**
- Modify: `prisma/schema.prisma:75-80`
- Create: migration file (auto-generated)

- [ ] **Step 1: Atualizar enum Badge no schema**

Em `prisma/schema.prisma`, substituir:

```prisma
enum Badge {
  BEST_VALUE
  BEST_SELLER
  PREMIUM
  CHEAPEST
}
```

Por:

```prisma
enum Badge {
  MELHOR_ESCOLHA
  CUSTO_BENEFICIO
  MAIS_VENDIDO
  PREMIUM
  RECOMENDADO
  BOM_E_BARATO
}
```

- [ ] **Step 2: Limpar badges antigos no banco antes da migration**

Antes de rodar a migration, os produtos com badges antigos (`BEST_VALUE`, `BEST_SELLER`, `CHEAPEST`) precisam ser limpos, senão a migration falha. Rodar:

```bash
npx prisma db execute --stdin <<< "UPDATE \"Product\" SET badge = NULL WHERE badge IN ('BEST_VALUE', 'BEST_SELLER', 'CHEAPEST');"
```

- [ ] **Step 3: Criar e aplicar a migration**

```bash
npx prisma migrate dev --name alterar-enum-badge
```

Expected: Migration criada e aplicada com sucesso. O Prisma vai pedir confirmação para alterar o enum.

- [ ] **Step 4: Verificar que o Prisma Client foi regenerado**

```bash
npx prisma generate
```

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: migra enum Badge para novas tags brasileiras (MELHOR_ESCOLHA, CUSTO_BENEFICIO, MAIS_VENDIDO, PREMIUM, RECOMENDADO, BOM_E_BARATO)"
```

---

### Task 2: Atualizar constants e validações

**Files:**
- Modify: `lib/constants.ts:1-6`
- Modify: `lib/validations.ts:35` (productSchema badge)
- Modify: `lib/validations.ts:110` (top10ProductSchema badge)

- [ ] **Step 1: Atualizar BADGE_LABELS em `lib/constants.ts`**

Substituir todo o conteúdo de `BADGE_LABELS`:

```typescript
export const BADGE_LABELS: Record<string, string> = {
  MELHOR_ESCOLHA: "Melhor Escolha",
  CUSTO_BENEFICIO: "Melhor Custo-Benefício",
  MAIS_VENDIDO: "Mais Vendido",
  PREMIUM: "Premium",
  RECOMENDADO: "Recomendado",
  BOM_E_BARATO: "Bom e Barato",
};
```

- [ ] **Step 2: Atualizar badge enum no `productSchema` em `lib/validations.ts`**

Linha 35, substituir:

```typescript
badge: z.enum(["BEST_VALUE", "BEST_SELLER", "PREMIUM", "CHEAPEST"]).optional().nullable(),
```

Por:

```typescript
badge: z.enum(["MELHOR_ESCOLHA", "CUSTO_BENEFICIO", "MAIS_VENDIDO", "PREMIUM", "RECOMENDADO", "BOM_E_BARATO"]).optional().nullable(),
```

- [ ] **Step 3: Atualizar badge enum no `top10ProductSchema` em `lib/validations.ts`**

Linha 110, substituir:

```typescript
badge: z.enum(["BEST_VALUE", "BEST_SELLER", "PREMIUM", "CHEAPEST"]).optional().nullable(),
```

Por:

```typescript
badge: z.enum(["MELHOR_ESCOLHA", "CUSTO_BENEFICIO", "MAIS_VENDIDO", "PREMIUM", "RECOMENDADO", "BOM_E_BARATO"]).optional().nullable(),
```

- [ ] **Step 4: Commit**

```bash
git add lib/constants.ts lib/validations.ts
git commit -m "feat: atualiza BADGE_LABELS e validações Zod com novas tags"
```

---

### Task 3: Atualizar RankingItem — remover preços e novas cores de badge

**Files:**
- Modify: `components/public/RankingItem.tsx`

- [ ] **Step 1: Atualizar BADGE_COLORS com novas cores**

No topo do arquivo, substituir:

```typescript
const BADGE_COLORS: Record<string, string> = {
  BEST_VALUE: "bg-green-500 text-white",
  BEST_SELLER: "bg-blue-500 text-white",
  PREMIUM: "bg-purple-500 text-white",
  CHEAPEST: "bg-yellow-400 text-yellow-900",
};
```

Por:

```typescript
const BADGE_COLORS: Record<string, string> = {
  MELHOR_ESCOLHA: "bg-green-500 text-white",
  CUSTO_BENEFICIO: "bg-blue-500 text-white",
  MAIS_VENDIDO: "bg-orange-500 text-white",
  PREMIUM: "bg-purple-500 text-white",
  RECOMENDADO: "bg-teal-500 text-white",
  BOM_E_BARATO: "bg-yellow-400 text-yellow-900",
};
```

- [ ] **Step 2: Remover campos de preço da interface Props**

Na interface Props, remover `currentPrice` e `oldPrice`:

```typescript
interface Props {
  position: number;
  product: {
    slug: string;
    name: string;
    shortDesc: string | null;
    imageUrl: string | null;
    rating: unknown;
    pros: string[];
    cons: string[];
    badge: string | null;
    brand: string | null;
    affiliateLinks: { id: string; platform: string; url: string; label: string | null }[];
  };
}
```

- [ ] **Step 3: Remover lógica de preço e desconto do componente**

Remover as linhas:

```typescript
const currentPrice = product.currentPrice != null ? Number(product.currentPrice) : null;
const oldPrice = product.oldPrice != null ? Number(product.oldPrice) : null;
const discountPct =
  currentPrice && oldPrice && oldPrice > currentPrice
    ? Math.round((1 - currentPrice / oldPrice) * 100)
    : null;
```

- [ ] **Step 4: Remover seção de preço do JSX**

Remover todo o bloco de preço dentro do `{/* Preço + CTAs */}`:

```tsx
{/* Preço */}
{currentPrice != null && (
  <div className="flex items-baseline gap-2 mb-3">
    <span className="text-3xl font-extrabold text-gray-900">
      {formatPrice(currentPrice)}
    </span>
    {oldPrice != null && (
      <span className="text-sm text-gray-400 line-through">{formatPrice(oldPrice)}</span>
    )}
    {discountPct && (
      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
        -{discountPct}% OFF
      </span>
    )}
  </div>
)}
```

- [ ] **Step 5: Remover import não utilizado de `formatPrice`**

Remover `formatPrice` do import:

```typescript
import { BADGE_LABELS, PLATFORM_DISPLAY } from "@/lib/constants";
```

(Remover a linha `import { formatPrice } from "@/lib/utils";`)

- [ ] **Step 6: Commit**

```bash
git add components/public/RankingItem.tsx
git commit -m "feat: remove preços e atualiza badges no RankingItem"
```

---

### Task 4: Atualizar página de ranking — remover props de preço

**Files:**
- Modify: `app/(public)/ranking/[slug]/page.tsx:156-174`

- [ ] **Step 1: Remover currentPrice e oldPrice das props passadas ao RankingItem**

No mapeamento dos items (linhas ~156-174), remover as propriedades `currentPrice` e `oldPrice`:

```tsx
<RankingItem
  key={item.id}
  position={item.order}
  product={{
    slug: item.product.slug,
    name: item.product.name,
    shortDesc: item.product.shortDesc,
    imageUrl: item.product.imageUrl,
    rating: item.product.rating,
    pros: item.product.pros,
    cons: item.product.cons,
    badge: item.product.badge,
    brand: item.product.brand,
    affiliateLinks: item.product.affiliateLinks,
  }}
/>
```

- [ ] **Step 2: Commit**

```bash
git add app/(public)/ranking/[slug]/page.tsx
git commit -m "feat: remove props de preço do RankingItem na página de ranking"
```

---

### Task 5: Atualizar página de produto — remover preços

**Files:**
- Modify: `app/(public)/produto/[slug]/page.tsx`

- [ ] **Step 1: Remover variáveis de preço**

Remover as linhas 48-53:

```typescript
const currentPrice = product.currentPrice != null ? Number(product.currentPrice) : null;
const oldPrice = product.oldPrice != null ? Number(product.oldPrice) : null;
const discountPct =
  currentPrice && oldPrice && oldPrice > currentPrice
    ? Math.round((1 - currentPrice / oldPrice) * 100)
    : null;
```

- [ ] **Step 2: Remover `offers` do JSON-LD**

No objeto `jsonLd`, remover a propriedade `offers`:

```typescript
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  description: product.shortDesc || product.longDesc || undefined,
  image: product.imageUrl || undefined,
  brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
};
```

- [ ] **Step 3: Remover bloco de preço do JSX**

Remover todo o bloco `{/* Preço */}` (linhas 139-167):

```tsx
{/* Preço */}
<div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
  ...todo o conteúdo de preço...
</div>
```

- [ ] **Step 4: Atualizar CTA flutuante do final da página**

Substituir o texto que referencia preços:

```tsx
<p className="font-bold text-lg mb-1">Gostou? Aproveite enquanto tem estoque!</p>
<p className="text-green-100 text-sm mb-4">Preços podem mudar a qualquer momento.</p>
```

Por:

```tsx
<p className="font-bold text-lg mb-1">Gostou? Aproveite enquanto tem estoque!</p>
<p className="text-green-100 text-sm mb-4">Clique e confira a oferta na loja parceira.</p>
```

- [ ] **Step 5: Remover import de `formatPrice`**

Remover `import { formatPrice } from "@/lib/utils";` do topo do arquivo.

- [ ] **Step 6: Commit**

```bash
git add app/(public)/produto/[slug]/page.tsx
git commit -m "feat: remove preços e offers JSON-LD da página de produto"
```

---

### Task 6: Atualizar formulário admin com novos badges

**Files:**
- Modify: `components/admin/ProductForm.tsx:164-174`

- [ ] **Step 1: Atualizar opções do SelectField de badge**

Substituir as opções do select de Selo:

```tsx
<SelectField
  label="Selo"
  name="badge"
  defaultValue={defaultValues.badge ?? ""}
  options={[
    { value: "", label: "— Nenhum —" },
    { value: "MELHOR_ESCOLHA", label: "Melhor Escolha" },
    { value: "CUSTO_BENEFICIO", label: "Melhor Custo-Benefício" },
    { value: "MAIS_VENDIDO", label: "Mais Vendido" },
    { value: "PREMIUM", label: "Premium" },
    { value: "RECOMENDADO", label: "Recomendado" },
    { value: "BOM_E_BARATO", label: "Bom e Barato" },
  ]}
/>
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/ProductForm.tsx
git commit -m "feat: atualiza select de badge no formulário admin com novas tags"
```

---

### Task 7: Atualizar lista admin de produtos (badge labels)

**Files:**
- Modify: `app/admin/produtos/page.tsx`

- [ ] **Step 1: Verificar que usa `BADGE_LABELS` de constants**

O arquivo já importa `BADGE_LABELS` de `lib/constants.ts` e usa `BADGE_LABELS[p.badge]`. Como já atualizamos o `constants.ts` na Task 2, isso vai funcionar automaticamente. Apenas verificar que não há valores hardcoded.

Run: `grep -n "BEST_VALUE\|BEST_SELLER\|CHEAPEST" app/admin/produtos/page.tsx`
Expected: Nenhum resultado.

- [ ] **Step 2: Commit (se houve alguma alteração)**

Se nenhuma alteração foi necessária, pular este commit.

---

### Task 8: Verificação final

- [ ] **Step 1: Rodar build para verificar que não há erros de tipo**

```bash
npm run build
```

Expected: Build completa sem erros.

- [ ] **Step 2: Verificar lint**

```bash
npm run lint
```

Expected: Sem erros de lint.

- [ ] **Step 3: Testar manualmente**

Verificações:
1. Acessar uma página de ranking — sem preços, badges com novas cores/labels
2. Acessar uma página de produto — sem seção de preço
3. Acessar admin > produtos > editar — select de badge com 6 novas opções
4. Criar produto com badge "Melhor Escolha" — verificar que salva e exibe corretamente
