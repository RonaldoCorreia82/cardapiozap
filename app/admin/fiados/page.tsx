export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { criarClienteServidor } from '@/lib/supabase-server'
import { buscarClientesComSaldo } from './actions'
import { AdminLayout } from '../page'
import { NovoClienteForm } from './NovoClienteForm'
import { BotaoDeletarCliente } from './BotaoDeletarCliente'
import { formatarPreco } from '@/lib/whatsapp'

export default async function FiadosPage() {
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

  // Recurso exclusivo do plano Pro
  if (restaurante?.plano !== 'pro') {
    return (
      <AdminLayout titulo="Fiados">
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <div className="text-4xl mb-4">⭐</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Recurso exclusivo do plano Pro</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            O controle de vendas e fiados está disponível apenas para assinantes do plano Pro.
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

  const clientes = await buscarClientesComSaldo()

  const totalEmAberto = clientes.reduce((acc, c) => acc + (c.saldo > 0 ? c.saldo : 0), 0)
  const totalVendido = clientes.reduce((acc, c) => acc + c.total_fiado, 0)
  const emDebito = clientes.filter((c) => c.saldo > 0).length

  return (
    <AdminLayout titulo="Fiados">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <p className="text-2xl font-bold text-red-700">{formatarPreco(totalEmAberto)}</p>
          <p className="text-xs text-red-500 mt-0.5">Total em aberto</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-700">{emDebito}</p>
          <p className="text-xs text-blue-500 mt-0.5">Clientes em débito</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <p className="text-2xl font-bold text-green-700">{formatarPreco(totalVendido)}</p>
          <p className="text-xs text-green-500 mt-0.5">Total fiado (histórico)</p>
        </div>
      </div>

      {/* Formulário novo cliente */}
      <div className="mb-4">
        <NovoClienteForm />
      </div>

      {/* Lista de clientes */}
      {clientes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
          Nenhum cliente cadastrado ainda. Clique em "Novo cliente" para começar.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {clientes.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              {/* Inicial */}
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 flex-shrink-0">
                {c.nome.charAt(0).toUpperCase()}
              </div>

              {/* Nome e telefone */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{c.nome}</p>
                {c.telefone && (
                  <p className="text-xs text-gray-400">{c.telefone}</p>
                )}
              </div>

              {/* Saldo */}
              <div className="text-right flex-shrink-0">
                <span
                  className={`text-sm font-bold ${
                    c.saldo > 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {formatarPreco(c.saldo > 0 ? c.saldo : 0)}
                </span>
                <p className="text-xs text-gray-400">
                  {c.saldo > 0 ? 'em aberto' : 'quite'}
                </p>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/admin/fiados/${c.id}`}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Ver conta
                </Link>
                <BotaoDeletarCliente
                  clienteId={c.id}
                  nome={c.nome}
                  saldo={c.saldo}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
