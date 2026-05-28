'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deletarRestaurante } from '@/app/actions/admin'

type Props = {
  id: string
  userId: string
  nome: string
}

export function BotaoDeletar({ id, userId, nome }: Props) {
  const [confirmando, setConfirmando] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const router = useRouter()

  async function handleDeletar() {
    setCarregando(true)
    const resultado = await deletarRestaurante(id, userId)
    if ('erro' in resultado) {
      alert(resultado.erro)
    } else {
      router.refresh()
    }
    setCarregando(false)
    setConfirmando(false)
  }

  if (confirmando) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleDeletar}
          disabled={carregando}
          className="text-xs text-red-600 font-semibold hover:underline disabled:opacity-50"
        >
          {carregando ? 'Excluindo...' : 'Confirmar'}
        </button>
        <button
          onClick={() => setConfirmando(false)}
          className="text-xs text-gray-400 hover:underline"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      className="text-xs text-red-400 hover:text-red-600 hover:underline font-medium"
      title={`Excluir ${nome}`}
    >
      Excluir
    </button>
  )
}
