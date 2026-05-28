'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deletarCliente } from './actions'

type Props = { clienteId: string; nome: string; saldo: number }

export function BotaoDeletarCliente({ clienteId, nome, saldo }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    if (saldo > 0) {
      alert(`${nome} ainda tem saldo em aberto de R$ ${saldo.toFixed(2).replace('.', ',')}. Quite o saldo antes de excluir.`)
      return
    }
    if (!confirm(`Excluir o cliente "${nome}"? Todo o histórico será apagado.`)) return

    startTransition(async () => {
      await deletarCliente(clienteId)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
      title="Excluir cliente"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  )
}
