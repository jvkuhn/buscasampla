"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "🏠" },
  { href: "/admin/rankings", label: "Rankings", icon: "🏆" },
  { href: "/admin/produtos", label: "Produtos", icon: "📦" },
  { href: "/admin/categorias", label: "Categorias", icon: "🗂️" },
  { href: "/admin/banners", label: "Banners", icon: "🖼️" },
  { href: "/admin/paginas", label: "Páginas", icon: "📄" },
  { href: "/admin/configuracoes", label: "Configurações", icon: "⚙️" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-gray-900 text-white flex flex-col">
      <div className="px-4 py-5 border-b border-gray-700">
        <p className="text-xs text-gray-400 uppercase tracking-widest">Admin</p>
        <p className="text-white font-bold text-lg">BuscasAmpla</p>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="w-full text-left text-sm text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800"
        >
          🚪 Sair
        </button>
      </div>
    </aside>
  );
}
