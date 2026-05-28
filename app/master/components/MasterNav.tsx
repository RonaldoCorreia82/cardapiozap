'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { criarClienteNavegador } from '@/lib/supabase'

export function MasterNav() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = criarClienteNavegador()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <nav className="bg-gray-900 text-white sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-white flex items-center gap-2">
            <span className="text-green-400">⚡</span>
            CardápioZap
            <span className="text-xs bg-green-600 px-2 py-0.5 rounded-full font-normal">
              Master
            </span>
          </span>
          <Link
            href="/master"
            className="text-sm text-gray-300 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/master/restaurantes/novo"
            className="text-sm text-gray-300 hover:text-white transition-colors"
          >
            + Novo restaurante
          </Link>
          <Link
            href="/master/banners"
            className="text-sm text-gray-300 hover:text-white transition-colors"
          >
            Banners
          </Link>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-red-400 transition-colors"
        >
          Sair
        </button>
      </div>
    </nav>
  )
}
