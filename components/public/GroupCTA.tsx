"use client";

interface Props {
  slug: string;
  inviteUrl: string;
  label: string;
}

/**
 * Botao de entrada no grupo.
 *
 * O evento Lead dispara no CLIQUE, nao no carregamento da pagina. Na versao
 * anterior a pagina redirecionava sozinha e todo visitante virava Lead, o que
 * ensinava a Meta a buscar quem abre link — nao quem entra em grupo. Aqui o
 * numero passa a significar intencao real.
 *
 * E um <a> de verdade: funciona sem JS, abre em nova aba e o navegador mostra o
 * destino ao passar o mouse. O onClick so acrescenta o rastreamento.
 */
export function GroupCTA({ slug, inviteUrl, label }: Props) {
  function handleClick() {
    window.fbq?.("track", "Lead", { content_name: slug });
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "grupo_whatsapp_clique", grupo_slug: slug });
  }

  return (
    <a
      href={inviteUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="group block w-full rounded-2xl bg-[#25d366] px-6 py-4 text-center shadow-[0_0_40px_-8px_rgba(37,211,102,0.7)] transition hover:bg-[#22c35e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#25d366] motion-safe:hover:scale-[1.02]"
    >
      <span className="block text-base font-extrabold tracking-wide text-[#06371a] sm:text-lg">
        {label}
      </span>
      <span className="mt-0.5 block text-xs font-medium text-[#0a5228]">
        Receba as ofertas todo dia
      </span>
    </a>
  );
}
