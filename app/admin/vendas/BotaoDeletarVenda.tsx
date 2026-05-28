'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deletarVenda } from './actions'

export function BotaoDeletarVenda({ vendaId }: { vendaId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    if (!confirm('Excluir esta venda?')) return
    startTransition(async () => {
      await deletarVenda(vendaId)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
      title="Excluir"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )
}
