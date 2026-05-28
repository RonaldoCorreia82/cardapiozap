'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deletarLancamento } from '../actions'

type Props = { lancamentoId: string; clienteId: string }

export function BotaoDeletarLancamento({ lancamentoId, clienteId }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    if (!confirm('Excluir este lançamento?')) return
    startTransition(async () => {
      await deletarLancamento(lancamentoId, clienteId)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
      title="Excluir lançamento"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )
}
