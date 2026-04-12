import Link from "next/link";

export function AffiliateDisclosure() {
  return (
    <aside
      aria-label="Aviso de afiliado"
      className="text-xs text-gray-500 text-center py-4 border-t border-gray-100 mt-10"
    >
      <p className="leading-relaxed max-w-xl mx-auto">
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
