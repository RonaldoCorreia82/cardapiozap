'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Prato } from '@/lib/supabase'
import { formatarPreco } from '@/lib/whatsapp'
import { useCarrinho } from './CarrinhoProvider'

type Props = {
  prato: Prato
}

export function PratoCard({ prato }: Props) {
  const { estado, adicionarItem, alterarQuantidade } = useCarrinho()
  const [adicionando, setAdicionando] = useState(false)

  const itemNoCarrinho = estado.itens.find((i) => i.prato.id === prato.id)
  const quantidade = itemNoCarrinho?.quantidade ?? 0

  function handleAdicionar() {
    setAdicionando(true)
    adicionarItem(prato)
    setTimeout(() => setAdicionando(false), 300)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex gap-3 p-3">
      {/* Foto do prato */}
      {prato.foto_url && (
        <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={prato.foto_url}
            alt={prato.nome}
            fill
            className="object-cover"
            sizes="96px"
          />
        </div>
      )}

      {/* Informações */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug">
            {prato.nome}
          </h3>
          {prato.descricao && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
              {prato.descricao}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-base font-bold text-green-700">
            {formatarPreco(prato.preco)}
          </span>

          {/* Controle de quantidade se já estiver no carrinho */}
          {quantidade > 0 ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => alterarQuantidade(prato.id, quantidade - 1)}
                className="w-8 h-8 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 font-bold text-base hover:bg-red-100 transition-colors"
                aria-label={`Remover um ${prato.nome}`}
              >
                −
              </button>
              <span className="text-sm font-bold text-gray-900 w-5 text-center">
                {quantidade}
              </span>
              <button
                onClick={handleAdicionar}
                className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-base hover:bg-green-700 transition-colors"
                aria-label={`Adicionar mais um ${prato.nome}`}
              >
                +
              </button>
            </div>
          ) : (
            // Botão inicial de adicionar
            <button
              onClick={handleAdicionar}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                adicionando
                  ? 'bg-green-100 text-green-700 scale-95'
                  : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
              }`}
              aria-label={`Adicionar ${prato.nome} ao carrinho`}
            >
              <span className="text-base leading-none">+</span>
              Adicionar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

