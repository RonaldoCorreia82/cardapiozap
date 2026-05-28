'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { criarCliente } from './actions'

export function NovoClienteForm() {
  const [aberto, setAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [erro, setErro] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function resetar() {
    setAberto(false)
    setNome('')
    setTelefone('')
    setErro('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    const fd = new FormData()
    fd.append('nome', nome)
    fd.append('telefone', telefone)

    startTransition(async () => {
      const resultado = await criarCliente(fd)
      if (resultado.erro) {
        setErro(resultado.erro)
      } else {
        resetar()
        router.refresh()
      }
    })
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
      >
        + Novo cliente
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-end"
    >
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Nome <span className="text-red-500">*</span>
        </label>
        <input
          autoFocus
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: João Silva"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        />
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Telefone (opcional)
        </label>
        <input
          type="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          placeholder="(75) 9 9999-9999"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        />
      </div>
      {erro && (
        <p className="text-xs text-red-500 sm:col-span-2">{erro}</p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {isPending ? 'Salvando...' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={resetar}
          className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm px-4 py-2 rounded-lg transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
