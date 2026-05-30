'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { criarClienteNavegador } from '@/lib/supabase'

const LINKS_DESKTOP = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/pratos', label: 'Pratos' },
  { href: '/admin/categorias', label: 'Categorias' },
  { href: '/admin/qrcode', label: 'QR Code' },
  { href: '/admin/vendas', label: 'Vendas' },
  { href: '/admin/fiados', label: 'Fiados' },
  { href: '/admin/configuracoes', label: 'Config' },
]

const LINKS_MOBILE = [
  { href: '/admin', label: 'Dash' },
  { href: '/admin/pratos', label: 'Pratos' },
  { href: '/admin/categorias', label: 'Categ' },
  { href: '/admin/qrcode', label: 'QR Code' },
  { href: '/admin/vendas', label: 'Vendas' },
  { href: '/admin/fiados', label: 'Fiados' },
  { href: '/admin/configuracoes', label: 'Config' },
]

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  // Ativo: exato para /admin, começa com href para sub-rotas
  const ativo =
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={`px-3 py-1.5 text-sm rounded-lg transition-colors whitespace-nowrap ${
        ativo
          ? 'bg-green-50 text-green-700 font-semibold'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {label}
    </Link>
  )
}

export function AdminNav() {
  async function handleLogout() {
    const supabase = criarClienteNavegador()
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-20">
      {/* Linha superior: logo + links desktop + logout */}
      <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link href="/admin" className="flex items-center">
          <Image
            src="/cardapio_zap_logo.jpg"
            alt="CardápioZap"
            width={110}
            height={31}
            className="h-7 w-auto"
          />
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {LINKS_DESKTOP.map((l) => (
            <NavLink key={l.href} href={l.href} label={l.label} />
          ))}
          <button
            onClick={handleLogout}
            className="ml-1 px-3 py-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Segunda linha: links mobile com scroll horizontal */}
      <div className="md:hidden border-t border-gray-50 overflow-x-auto">
        <div className="flex items-center gap-0.5 px-2 py-1.5 w-max">
          {LINKS_MOBILE.map((l) => (
            <NavLink key={l.href} href={l.href} label={l.label} />
          ))}
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  )
}
