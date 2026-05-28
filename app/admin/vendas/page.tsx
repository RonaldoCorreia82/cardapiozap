import { redirect } from 'next/navigation'
import Link from 'next/link'
import { criarClienteServidor } from '@/lib/supabase-server'
import { buscarVendasDoDia, buscarResumoMensal } from './actions'
import { FORMAS, CORES, type FormaPagamento } from './constants'
import { AdminLayout } from '../page'
import { NovaVendaForm } from './NovaVendaForm'
import { BotaoDeletarVenda } from './BotaoDeletarVenda'
import { FiltroData } from './FiltroData'
import { formatarPreco } from '@/lib/whatsapp'

type Props = { searchParams: { data?: string } }

export default async function VendasPage({ searchParams }: Props) {
  const supabase = criarClienteServidor()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: restaurante } = await supabase
    .from('restaurantes')
    .select('plano')
    .eq('user_id', user.id)
    .single()

  if (restaurante?.plano !== 'pro') {
    return (
      <AdminLayout titulo="Controle de Vendas">
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <div className="text-4xl mb-4">⭐</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Recurso exclusivo do plano Pro
          </h2>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            O controle de vendas está disponível apenas para assinantes do plano Pro.
          </p>
          <Link
            href="/admin/configuracoes"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            Ver meu plano
          </Link>
        </div>
      </AdminLayout>
    )
  }

  const hoje = new Date().toISOString().slice(0, 10)
  const dataFiltro = searchParams.data ?? hoje

  // Data do mês/ano atual para o resumo mensal
  const dataRef = new Date(dataFiltro + 'T12:00:00')
  const ano = dataRef.getFullYear()
  const mes = dataRef.getMonth() + 1

  const [vendas, resumoMensal] = await Promise.all([
    buscarVendasDoDia(dataFiltro),
    buscarResumoMensal(ano, mes),
  ])

  // Totais do dia por forma
  const totalDia = vendas.reduce((acc, v) => acc + Number(v.valor), 0)
  const porFormaDia = vendas.reduce<Record<string, number>>((acc, v) => {
    acc[v.forma_pagamento] = (acc[v.forma_pagamento] ?? 0) + Number(v.valor)
    return acc
  }, {})

  const nomeMes = dataRef.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <AdminLayout titulo="Controle de Vendas">
      {/* Filtro de data */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <FiltroData dataAtual={dataFiltro} />
        <NovaVendaForm />
      </div>

      {/* Cards do dia */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <div className="col-span-2 sm:col-span-1 bg-gray-900 text-white rounded-xl p-4">
          <p className="text-xl font-extrabold">{formatarPreco(totalDia)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total do dia</p>
          <p className="text-xs text-gray-500 mt-1">{vendas.length} venda{vendas.length !== 1 ? 's' : ''}</p>
        </div>
        {(Object.keys(FORMAS) as FormaPagamento[]).map((f) => (
          <div key={f} className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-lg font-bold text-gray-900">
              {formatarPreco(porFormaDia[f] ?? 0)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{FORMAS[f]}</p>
          </div>
        ))}
      </div>

      {/* Lista de vendas do dia */}
      {vendas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 text-sm mb-8">
          Nenhuma venda registrada neste dia.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 mb-8">
          {vendas.map((v) => (
            <div key={v.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
              {/* Hora */}
              <span className="text-xs text-gray-400 flex-shrink-0 w-12">
                {new Date(v.created_at).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>

              {/* Descrição */}
              <p className="flex-1 text-sm text-gray-700 truncate">
                {v.descricao || '—'}
              </p>

              {/* Forma */}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${CORES[v.forma_pagamento]}`}>
                {FORMAS[v.forma_pagamento]}
              </span>

              {/* Valor */}
              <span className="text-sm font-bold text-gray-900 flex-shrink-0 w-24 text-right">
                {formatarPreco(Number(v.valor))}
              </span>

              {/* Excluir */}
              <BotaoDeletarVenda vendaId={v.id} />
            </div>
          ))}
        </div>
      )}

      {/* Resumo do mês */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">
          Resumo de {nomeMes}
        </h2>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600">Total do mês</span>
          <span className="text-lg font-extrabold text-gray-900">
            {formatarPreco(resumoMensal.total)}
          </span>
        </div>
        <div className="space-y-2">
          {(Object.keys(FORMAS) as FormaPagamento[]).map((f) => {
            const val = resumoMensal.porForma[f] ?? 0
            const pct = resumoMensal.total > 0 ? (val / resumoMensal.total) * 100 : 0
            return (
              <div key={f}>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{FORMAS[f]}</span>
                  <span>{formatarPreco(val)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
