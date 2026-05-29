export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { criarClienteServidor, criarClienteServico } from '@/lib/supabase-server'
import type { Restaurante } from '@/lib/supabase'
import { MasterNav } from './components/MasterNav'
import { ToggleAtivo } from './components/ToggleAtivo'
import { BotaoDeletar } from './components/BotaoDeletar'

const MASTER_EMAIL =
  process.env.MASTER_EMAIL || 'ronaldocorreia8206@gmail.com'

export default async function MasterPage() {
  const supabase = criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()

  // Segurança: só o master admin acessa
  if (!user || user.email !== MASTER_EMAIL) {
    redirect('/admin/login')
  }

  // Verifica se a service key está disponível
  const serviceKeyDisponivel = !!process.env.SUPABASE_SERVICE_ROLE_KEY

  let lista: Restaurante[] = []
  let pedidosHoje: number | null = 0
  let totalPratos: number | null = 0
  let pedidosPorRestaurante: Record<string, number> = {}

  if (serviceKeyDisponivel) {
    const admin = criarClienteServico()

    const { data: restaurantes } = await admin
      .from('restaurantes')
      .select('*')
      .order('created_at', { ascending: false })

    lista = restaurantes ?? []

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const [
      { count: cPedidosHoje },
      { count: cTotalPratos },
      { data: todosPedidos },
    ] = await Promise.all([
      admin
        .from('pedidos')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', hoje.toISOString()),
      admin
        .from('pratos')
        .select('id', { count: 'exact', head: true }),
      admin
        .from('pedidos')
        .select('restaurante_id'),
    ])

    pedidosHoje = cPedidosHoje
    totalPratos = cTotalPratos
    pedidosPorRestaurante = (todosPedidos ?? []).reduce<Record<string, number>>(
      (acc, p) => {
        acc[p.restaurante_id] = (acc[p.restaurante_id] ?? 0) + 1
        return acc
      },
      {}
    )
  }

  const ativos = lista.filter((r) => r.ativo).length

  return (
    <div className="min-h-screen bg-gray-50">
      <MasterNav />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {!serviceKeyDisponivel && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            ⚠️ <strong>Configuração pendente:</strong> adicione a variável{' '}
            <code className="bg-amber-100 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code>{' '}
            nas <strong>Settings → Environment Variables</strong> da Vercel e faça um novo deploy.
            Sem ela os dados de restaurantes não são exibidos.
          </div>
        )}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Visão Geral</h1>
            <p className="text-sm text-gray-500">Gerencie todos os restaurantes cadastrados</p>
          </div>
          <Link
            href="/master/restaurantes/novo"
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            + Novo restaurante
          </Link>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <CardStat label="Total de restaurantes" valor={String(lista.length)} cor="gray" />
          <CardStat label="Restaurantes ativos" valor={String(ativos)} cor="green" />
          <CardStat label="Pedidos hoje" valor={String(pedidosHoje ?? 0)} cor="blue" />
          <CardStat label="Pratos cadastrados" valor={String(totalPratos ?? 0)} cor="orange" />
        </div>

        {/* Tabela de restaurantes */}
        {lista.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400 text-sm mb-4">Nenhum restaurante cadastrado ainda.</p>
            <Link
              href="/master/restaurantes/novo"
              className="text-green-600 font-semibold text-sm hover:underline"
            >
              Cadastrar o primeiro restaurante →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Restaurante</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Slug / Cardápio</th>
                  <th className="px-4 py-3 font-medium text-gray-600">WhatsApp</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Plano</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-center">Pedidos</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Cadastro</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-center">Ativo</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lista.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{r.nome}</p>
                      {r.horario && (
                        <p className="text-xs text-gray-400 mt-0.5">{r.horario}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/${r.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline text-xs font-mono"
                      >
                        /{r.slug}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">
                      {r.whatsapp}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          r.plano === 'pro'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {r.plano === 'pro' ? 'Pro' : 'Básico'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-semibold text-gray-900">
                        {pedidosPorRestaurante[r.id] ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(r.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ToggleAtivo id={r.id} ativo={r.ativo} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/master/restaurantes/${r.id}/editar`}
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          Editar
                        </Link>
                        <BotaoDeletar id={r.id} userId={r.user_id} nome={r.nome} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

function CardStat({
  label,
  valor,
  cor,
}: {
  label: string
  valor: string
  cor: 'gray' | 'green' | 'blue' | 'orange'
}) {
  const cores = {
    gray: 'bg-white border-gray-100',
    green: 'bg-green-50 border-green-100',
    blue: 'bg-blue-50 border-blue-100',
    orange: 'bg-orange-50 border-orange-100',
  }
  return (
    <div className={`rounded-xl border p-4 ${cores[cor]}`}>
      <p className="text-2xl font-bold text-gray-900">{valor}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}
