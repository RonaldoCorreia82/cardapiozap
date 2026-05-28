'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { adicionarLancamento } from '../actions'
import { formatarPreco } from '@/lib/whatsapp'

type Props = { clienteId: string; saldo: number }

export function LancamentoForm({ clienteId, saldo }: Props) {
  const [tipo, setTipo] = useState<'fiado' | 'pagamento'>('fiado')
  const [aberto, setAberto] = useState(false)
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [erro, setErro] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function resetar() {
    setAberto(false)
    setDescricao('')
    setValor('')
    setErro('')
  }

  function abrirForm(t: 'fiado' | 'pagamento') {
    setTipo(t)
    setAberto(true)
    setErro('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    const fd = new FormData()
    fd.append('descricao', descricao)
    fd.append('valor', valor)

    startTransition(async () => {
      const resultado = await adicionarLancamento(clienteId, tipo, fd)
      if (resultado.erro) {
        setErro(resultado.erro)
      } else {
        resetar()
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-3">
      {/* Botões de ação */}
      {!aberto && (
        <div className="flex gap-3">
          <button
            onClick={() => abrirForm('fiado')}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            + Registrar fiado
          </button>
          <button
            onClick={() => abrirForm('pagamento')}
            disabled={saldo <= 0}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            title={saldo <= 0 ? 'Cliente não tem saldo em aberto' : undefined}
          >
            ✓ Receber pagamento
          </button>
        </div>
      )}

      {/* Formulário inline */}
      {aberto && (
        <form
          onSubmit={handleSubmit}
          className={`rounded-xl border-2 p-4 space-y-3 ${
            tipo === 'fiado'
              ? 'border-orange-200 bg-orange-50'
              : 'border-green-200 bg-green-50'
          }`}
        >
          <p className="text-sm font-bold text-gray-800">
            {tipo === 'fiado' ? 'Novo fiado' : 'Registrar pagamento recebido'}
          </p>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Descrição (opcional)
              </label>
              <input
                autoFocus
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder={tipo === 'fiado' ? 'Ex: 2 marmitas' : 'Ex: pix'}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
              />
            </div>
            <div className="w-36">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Valor <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={valor}
                  onChange={(e) =>
                    setValor(e.target.value.replace(/[^0-9,.]/g, ''))
                  }
                  placeholder="0,00"
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
                />
              </div>
            </div>
          </div>

          {tipo === 'pagamento' && saldo > 0 && (
            <p className="text-xs text-gray-500">
              Saldo atual em aberto: <span className="font-semibold text-red-600">{formatarPreco(saldo)}</span>
            </p>
          )}

          {erro && <p className="text-xs text-red-500">{erro}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className={`flex-1 text-white text-sm font-semibold py-2 rounded-lg transition-colors disabled:opacity-60 ${
                tipo === 'fiado'
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isPending ? 'Salvando...' : 'Confirmar'}
            </button>
            <button
              type="button"
              onClick={resetar}
              className="border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
