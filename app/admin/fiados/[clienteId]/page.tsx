import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { criarClienteServidor } from '@/lib/supabase-server'
import { buscarClienteDetalhe } from '../actions'
import { AdminLayout } from '../../page'
import { LancamentoForm } from './LancamentoForm'
import { BotaoDeletarLancamento } from './BotaoDeletarLancamento'
import { formatarPreco } from '@/lib/whatsapp'

type Props = { params: { clienteId: string } }

export default async function ClienteFiadoPage({ params }: Props) {
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

  if (restaurante?.plano !== 'pro') redirect('/admin/fiados')

  const detalhe = await buscarClienteDetalhe(params.clienteId)
  if (!detalhe) notFound()

  const { cliente, lancamentos } = detalhe

  // Calcula saldo
  const totalFiado = lancamentos
    .filter((l) => l.tipo === 'fiado')
    .reduce((acc, l) => acc + Number(l.valor), 0)
  const totalPago = lancamentos
    .filter((l) => l.tipo === 'pagamento')
    .reduce((acc, l) => acc + Number(l.valor), 0)
  const saldo = totalFiado - totalPago

  return (
    <AdminLayout titulo="">
      {/* Cabeçalho do cliente */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/fiados"
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Voltar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-base font-bold text-gray-600 flex-shrink-0">
          {cliente.nome.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">{cliente.nome}</h1>
          {cliente.telefone && (
            <p className="text-xs text-gray-400">{cliente.telefone}</p>
          )}
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className={`rounded-xl border p-3 text-center ${saldo > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
          <p className={`text-xl font-extrabold ${saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatarPreco(saldo > 0 ? saldo : 0)}
          </p>
          <p className={`text-xs mt-0.5 ${saldo > 0 ? 'text-red-400' : 'text-green-500'}`}>
            {saldo > 0 ? 'em aberto' : 'quite ✓'}
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-center">
          <p className="text-xl font-extrabold text-orange-600">{formatarPreco(totalFiado)}</p>
          <p className="text-xs text-orange-400 mt-0.5">total fiado</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
          <p className="text-xl font-extrabold text-blue-600">{formatarPreco(totalPago)}</p>
          <p className="text-xs text-blue-400 mt-0.5">total recebido</p>
        </div>
      </div>

      {/* Formulário de novo lançamento */}
      <div className="mb-6">
        <LancamentoForm clienteId={cliente.id} saldo={saldo} />
      </div>

      {/* Extrato */}
      <div>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
          Extrato ({lancamentos.length} lançamentos)
        </h2>

        {lancamentos.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
            Nenhum lançamento ainda.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
            {lancamentos.map((l) => (
              <div key={l.id} className="flex items-center gap-3 px-4 py-3">
                {/* Badge tipo */}
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    l.tipo === 'fiado'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {l.tipo === 'fiado' ? 'Fiado' : 'Pago'}
                </span>

                {/* Descrição e data */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">
                    {l.descricao || (l.tipo === 'fiado' ? 'Fiado' : 'Pagamento')}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(l.created_at).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Valor */}
                <span
                  className={`text-sm font-bold flex-shrink-0 ${
                    l.tipo === 'fiado' ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {l.tipo === 'fiado' ? '+' : '−'} {formatarPreco(Number(l.valor))}
                </span>

                {/* Excluir */}
                <BotaoDeletarLancamento
                  lancamentoId={l.id}
                  clienteId={cliente.id}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
