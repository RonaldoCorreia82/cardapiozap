'use client'

import { useState } from 'react'
import { toggleAtivoRestaurante } from '@/app/actions/admin'

type Props = {
  id: string
  ativo: boolean
}

export function ToggleAtivo({ id, ativo: ativoInicial }: Props) {
  const [ativo, setAtivo] = useState(ativoInicial)
  const [carregando, setCarregando] = useState(false)

  async function handleToggle() {
    setCarregando(true)
    const novoValor = !ativo
    setAtivo(novoValor)

    const resultado = await toggleAtivoRestaurante(id, novoValor)
    if ('erro' in resultado) {
      setAtivo(!novoValor) // reverte em caso de erro
    }
    setCarregando(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={carregando}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
        ativo ? 'bg-green-500' : 'bg-gray-300'
      }`}
      title={ativo ? 'Clique para desativar' : 'Clique para ativar'}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          ativo ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}
