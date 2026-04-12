import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function formatPrice(price: number | string | null | undefined): string {
  if (price == null) return "";
  const n = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + "…" : str;
}

/**
 * Serializa um objeto JSON-LD para uso dentro de <script type="application/ld+json">.
 *
 * JSON.stringify() não escapa `<`, `>` ou `&`, então uma string tipo `</script>` dentro
 * do payload escapa do contexto do <script> e permite XSS. Esta função escapa esses
 * caracteres usando os unicode escapes que JSON aceita, mantendo o JSON válido e seguro
 * pra incorporar em HTML.
 */
export function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
