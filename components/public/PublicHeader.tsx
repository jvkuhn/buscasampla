"use client";

import Link from "next/link";
import { useState } from "react";

interface Props {
  categories: { id: string; name: string; slug: string }[];
  settings: { siteName: string; logoUrl: string | null } | null;
}

export function PublicHeader({ categories, settings }: Props) {
  const siteName = settings?.siteName ?? "BuscasAmpla";
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">

        {/* Logo / Nome */}
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 font-extrabold text-xl text-blue-600 hover:text-blue-700 transition-colors"
        >
          {settings?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt={siteName} className="h-8" />
          ) : (
            <span>{siteName}</span>
          )}
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {/* Dropdown Categorias */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
              Categorias
              <svg className="w-3.5 h-3.5 mt-0.5 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown panel */}
            <div className="absolute top-full left-0 pt-2 w-56 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 pointer-events-none group-hover:pointer-events-auto">
            <div className="bg-white border border-gray-200 rounded-xl shadow-xl py-2">
              {categories.length === 0 ? (
                <p className="px-4 py-2 text-sm text-gray-400">Nenhuma categoria</p>
              ) : (
                categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/categorias/${c.slug}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    {c.name}
                  </Link>
                ))
              )}
              <div className="border-t border-gray-100 mt-1 pt-1">
                <Link
                  href="/categorias"
                  className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  Ver todas as categorias →
                </Link>
              </div>
            </div>
            </div>
          </div>
        </nav>

        {/* Busca — desktop */}
        <form action="/busca" method="get" className="hidden md:flex flex-1 max-w-md ml-auto">
          <div className="relative w-full">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="search"
              name="q"
              placeholder="Buscar produto ou categoria..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
        </form>

        {/* Botão mobile */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden ml-auto p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Menu"
        >
          {mobileOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Menu mobile */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 space-y-1 shadow-lg">
          {/* Busca mobile */}
          <form action="/busca" method="get" className="pb-2">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="search"
                name="q"
                placeholder="Buscar produto ou categoria..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
            </div>
          </form>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 pt-1">Categorias</p>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/categorias/${c.slug}`}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-2 py-2.5 text-sm text-gray-700 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
              {c.name}
            </Link>
          ))}
          <Link
            href="/categorias"
            onClick={() => setMobileOpen(false)}
            className="block px-2 py-2 text-sm font-semibold text-blue-600"
          >
            Ver todas →
          </Link>
        </div>
      )}
    </header>
  );
}
