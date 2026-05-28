'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { registrarVenda } from './actions'
import { FORMAS, type FormaPagamento } from './constants'

export function NovaVendaForm() {
  const [aberto, setAberto] = useState(false)
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [forma, setForma] = useState<FormaPagamento>('pix')
  const [erro, setErro] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function resetar() {
    setAberto(false)
    setDescricao('')
    setValor('')
    setForma('pix')
    setErro('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    const fd = new FormData()
    fd.append('descricao', descricao)
    fd.append('valor', valor)
    fd.append('forma_pagamento', forma)

    startTransition(async () => {
      const resultado = await registrarVenda(fd)
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
        + Nova venda
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border-2 border-green-200 rounded-xl p-4 space-y-3"
    >
      <p className="text-sm font-bold text-gray-800">Registrar venda</p>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Descrição */}
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Descrição (opcional)
          </label>
          <input
            autoFocus
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Almoço, X-Burguer..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
          />
        </div>

        {/* Valor */}
        <div className="w-36">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Valor <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              R$
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={valor}
              onChange={(e) =>
                setValor(e.target.value.replace(/[^0-9,.]/g, ''))
              }
              placeholder="0,00"
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>
        </div>

        {/* Forma de pagamento */}
        <div className="w-44">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Forma de pagamento <span className="text-red-500">*</span>
          </label>
          <select
            value={forma}
            onChange={(e) => setForma(e.target.value as FormaPagamento)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
          >
            {(Object.entries(FORMAS) as [FormaPagamento, string][]).map(
              ([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {erro && <p className="text-xs text-red-500">{erro}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
        >
          {isPending ? 'Salvando...' : 'Salvar venda'}
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
