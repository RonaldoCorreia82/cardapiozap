'use client'

import { useCarrinho } from './CarrinhoProvider'
import { formatarPreco } from '@/lib/whatsapp'

export function CarrinhoBotaoFlutuante() {
  const { totalItens, totalValor, abrirDrawer, hasBanners } = useCarrinho()

  if (totalItens === 0) return null

  return (
    <div className={`fixed left-0 right-0 z-40 flex justify-center px-4 ${hasBanners ? 'bottom-[calc(22.22vw_+_12px)]' : 'bottom-4'}`}>
      <button
        onClick={abrirDrawer}
        className="w-full max-w-sm bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-3.5 px-5 rounded-2xl shadow-lg flex items-center justify-between transition-colors"
        aria-label="Abrir carrinho"
      >
        <span className="flex items-center gap-2">
          <span className="bg-white text-green-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {totalItens}
          </span>
          Ver pedido
        </span>
        <span className="font-semibold">{formatarPreco(totalValor)}</span>
      </button>
    </div>
  )
}
