import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { criarClienteServidor } from '@/lib/supabase-server'
import type { Pedido } from '@/lib/supabase'
import { formatarPreco } from '@/lib/whatsapp'

// ============================================================
// Dashboard do restaurante — SSR com dados do dia
// ============================================================
export default async function AdminDashboard() {
  const supabase = criarClienteServidor()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  // Busca restaurante do usuário logado
  const { data: restaurante } = await supabase
    .from('restaurantes')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!restaurante) {
    // Usuário sem restaurante cadastrado — deve ser primeiro acesso
    return (
      <AdminLayout titulo="Bem-vindo">
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">
            Seu restaurante ainda não está configurado.
          </p>
          <Link
            href="/admin/configuracoes"
            className="inline-block bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Configurar restaurante
          </Link>
        </div>
      </AdminLayout>
    )
  }

  // Data de hoje (início e fim)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const amanha = new Date(hoje)
  amanha.setDate(amanha.getDate() + 1)

  // Pedidos de hoje ordenados por nome do cliente
  const { data: pedidosHoje } = await supabase
    .from('pedidos')
    .select('*')
    .eq('restaurante_id', restaurante.id)
    .gte('created_at', hoje.toISOString())
    .lt('created_at', amanha.toISOString())
    .order('mesa', { ascending: true })

  // Últimos 10 pedidos ordenados por nome do cliente
  const { data: ultimosPedidos } = await supabase
    .from('pedidos')
    .select('*')
    .eq('restaurante_id', restaurante.id)
    .order('mesa', { ascending: true })
    .limit(10)

  // Total de pratos cadastrados
  const { count: totalPratos } = await supabase
    .from('pratos')
    .select('id', { count: 'exact', head: true })
    .eq('restaurante_id', restaurante.id)

  const listaHoje: Pedido[] = pedidosHoje ?? []
  const listaUltimos: Pedido[] = ultimosPedidos ?? []

  const faturamentoHoje = listaHoje.reduce((acc, p) => acc + Number(p.total), 0)

  return (
    <AdminLayout titulo={restaurante.nome}>
      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <CardResumo
          label="Pedidos hoje"
          valor={String(listaHoje.length)}
          icone="📋"
          cor="blue"
        />
        <CardResumo
          label="Faturado hoje"
          valor={formatarPreco(faturamentoHoje)}
          icone="💰"
          cor="green"
        />
        <CardResumo
          label="Pratos"
          valor={String(totalPratos ?? 0)}
          icone="🍽️"
          cor="orange"
        />
      </div>

      {/* Link rápido para o cardápio */}
      <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-green-800">Seu cardápio público</p>
            <p className="text-xs text-green-600 break-all">
              {process.env.NEXT_PUBLIC_APP_URL ?? 'https://seu-dominio.com'}/{restaurante.slug}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={`/${restaurante.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs font-semibold bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Visualizar cardápio
          </a>
          <Link
            href="/admin/qrcode"
            className="flex-1 text-center text-xs font-semibold bg-white border border-green-200 text-green-700 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors"
          >
            Ver QR Code
          </Link>
        </div>
      </div>

      {/* Últimos pedidos */}
      <div>
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
          Últimos pedidos
        </h2>

        {listaUltimos.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
            Nenhum pedido registrado ainda.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
            {listaUltimos.map((pedido) => (
              <div key={pedido.id} className="px-3 py-2.5 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="text-xs font-bold text-gray-900 truncate max-w-[120px]">
                      {pedido.mesa}
                    </span>
                    <BadgeStatus status={pedido.status} />
                    <span className="text-[10px] text-gray-400 ml-auto">
                      {new Date(pedido.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">
                    {(pedido.itens as Pedido['itens']).map(
                      (i) => `${i.quantidade}x ${i.nome}`
                    ).join(' · ')}
                  </p>
                </div>
                <span className="text-sm font-bold text-gray-900 whitespace-nowrap ml-2">
                  {formatarPreco(Number(pedido.total))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

// ============================================================
// Componentes auxiliares da página
// ============================================================

function CardResumo({
  label,
  valor,
  icone,
  cor,
}: {
  label: string
  valor: string
  icone: string
  cor: 'blue' | 'green' | 'orange'
}) {
  const cores = {
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    orange: 'bg-orange-50 border-orange-100',
  }

  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${cores[cor]}`}>
      <div className="text-xl sm:text-2xl mb-1">{icone}</div>
      <p className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight">{valor}</p>
      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 leading-tight">{label}</p>
    </div>
  )
}

function BadgeStatus({ status }: { status: string }) {
  const estilos: Record<string, string> = {
    enviado: 'bg-yellow-100 text-yellow-700',
    em_preparo: 'bg-blue-100 text-blue-700',
    pronto: 'bg-green-100 text-green-700',
    entregue: 'bg-gray-100 text-gray-600',
    cancelado: 'bg-red-100 text-red-600',
  }

  const labels: Record<string, string> = {
    enviado: 'Enviado',
    em_preparo: 'Em preparo',
    pronto: 'Pronto',
    entregue: 'Entregue',
    cancelado: 'Cancelado',
  }

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${estilos[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {labels[status] ?? status}
    </span>
  )
}

// ============================================================
// Layout reutilizável do painel admin
// ============================================================
export function AdminLayout({
  titulo,
  children,
}: {
  titulo: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barra de navegação */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-20">
        {/* Linha superior: logo */}
        <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/admin" className="flex items-center">
            <Image src="/cardapio_zap_logo.jpg" alt="CardápioZap" width={110} height={31} className="h-7 w-auto" />
          </Link>
          {/* Links apenas no desktop */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/admin" label="Dashboard" />
            <NavLink href="/admin/pratos" label="Pratos" />
            <NavLink href="/admin/categorias" label="Categorias" />
            <NavLink href="/admin/qrcode" label="QR Code" />
            <NavLink href="/admin/vendas" label="Vendas" />
            <NavLink href="/admin/fiados" label="Fiados" />
            <NavLink href="/admin/configuracoes" label="Config" />
          </div>
        </div>
        {/* Links no mobile — scroll horizontal */}
        <div className="md:hidden border-t border-gray-50 overflow-x-auto">
          <div className="flex items-center gap-0.5 px-2 py-1.5 w-max">
            <NavLink href="/admin" label="Dash" />
            <NavLink href="/admin/pratos" label="Pratos" />
            <NavLink href="/admin/categorias" label="Categ" />
            <NavLink href="/admin/qrcode" label="QR Code" />
            <NavLink href="/admin/vendas" label="Vendas" />
            <NavLink href="/admin/fiados" label="Fiados" />
            <NavLink href="/admin/configuracoes" label="Config" />
          </div>
        </div>
      </nav>

      {/* Conteúdo */}
      <main className="max-w-3xl mx-auto px-4 py-5">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-5 truncate">{titulo}</h1>
        {children}
      </main>
    </div>
  )
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
    >
      {label}
    </Link>
  )
}
