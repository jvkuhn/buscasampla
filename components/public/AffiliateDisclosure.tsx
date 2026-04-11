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
