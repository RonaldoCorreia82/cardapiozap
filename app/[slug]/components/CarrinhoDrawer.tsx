'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useCarrinho } from './CarrinhoProvider'
import { gerarLinkWhatsapp, formatarPreco } from '@/lib/whatsapp'
import { registrarPedido } from '@/app/actions/pedidos'

const PIX_TIPO_LABEL: Record<string, string> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'E-mail',
  telefone: 'Telefone',
  aleatoria: 'Chave Aleatória',
}

type Props = {
  nomeRestaurante: string
}

export function CarrinhoDrawer({ nomeRestaurante }: Props) {
  const {
    estado,
    fecharDrawer,
    removerItem,
    alterarQuantidade,
    limparCarrinho,
    setMesa,
    setObservacao,
    setEntrega,
    setEnderecoEntrega,
    subtotal,
    totalValor,
    taxaEntrega,
    itensPedido,
    restauranteId,
    whatsappRestaurante,
    pixChave,
    pixTipo,
  } = useCarrinho()

  const [enviando, setEnviando] = useState(false)
  const [erroMesa, setErroMesa] = useState('')
  const [pixCopiado, setPixCopiado] = useState(false)
  const mesaRef = useRef<HTMLInputElement>(null)

  const copiarPix = useCallback(async () => {
    if (!pixChave) return
    try {
      await navigator.clipboard.writeText(pixChave)
      setPixCopiado(true)
      setTimeout(() => setPixCopiado(false), 2500)
    } catch {
      // Fallback para navegadores sem clipboard API
      const el = document.createElement('textarea')
      el.value = pixChave
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setPixCopiado(true)
      setTimeout(() => setPixCopiado(false), 2500)
    }
  }, [pixChave])

  // Foca no campo mesa ao abrir o drawer se estiver vazio
  useEffect(() => {
    if (estado.drawerAberto && !estado.mesa) {
      setTimeout(() => mesaRef.current?.focus(), 300)
    }
  }, [estado.drawerAberto, estado.mesa])

  // Fecha drawer ao pressionar Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fecharDrawer()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [fecharDrawer])

  async function handleFazerPedido() {
    if (!estado.mesa.trim()) {
      setErroMesa('Informe o nome do cliente para continuar.')
      mesaRef.current?.focus()
      return
    }
    if (estado.entrega && !estado.enderecoEntrega.trim()) {
      setErroMesa('Informe o endereço de entrega para continuar.')
      return
    }
    if (itensPedido.length === 0) return

    setErroMesa('')
    setEnviando(true)

    // Abre WhatsApp imediatamente — não pode depender do banco
    const link = gerarLinkWhatsapp(
      whatsappRestaurante,
      estado.mesa.trim(),
      itensPedido,
      totalValor,
      estado.observacao,
      estado.entrega,
      estado.enderecoEntrega,
      taxaEntrega,
      pixChave,
      pixTipo
    )
    window.open(link, '_blank')

    // Registra pedido no Supabase em segundo plano (falha silenciosa)
    registrarPedido({
      restaurante_id: restauranteId,
      mesa: estado.mesa.trim(),
      itens: itensPedido,
      total: totalValor,
      observacao: estado.observacao || undefined,
    }).catch(() => {
      // Erro de registro não afeta o cliente
    })

    // Limpa carrinho e fecha drawer após enviar
    setTimeout(() => {
      limparCarrinho()
      fecharDrawer()
      setEnviando(false)
    }, 500)
  }

  if (!estado.drawerAberto) return null

  return (
    <>
      {/* Overlay escuro */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={fecharDrawer}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho de compras"
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Alça de arrasto visual */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Seu pedido</h2>
          <button
            onClick={fecharDrawer}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Fechar carrinho"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Lista de itens — scroll interno */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {estado.itens.length === 0 ? (
            <p className="text-center text-gray-400 py-8">
              Seu carrinho está vazio. Adicione itens do cardápio!
            </p>
          ) : (
            estado.itens.map((item) => (
              <div
                key={item.prato.id}
                className="flex items-center gap-3 bg-gray-50 rounded-xl p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {item.prato.nome}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatarPreco(item.prato.preco)} cada
                  </p>
                </div>

                {/* Controle de quantidade */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      alterarQuantidade(item.prato.id, item.quantidade - 1)
                    }
                    className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-red-50 hover:border-red-300 transition-colors text-sm font-bold"
                    aria-label={`Remover um ${item.prato.nome}`}
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-sm font-semibold text-gray-900">
                    {item.quantidade}
                  </span>
                  <button
                    onClick={() =>
                      alterarQuantidade(item.prato.id, item.quantidade + 1)
                    }
                    className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-green-50 hover:border-green-300 transition-colors text-sm font-bold"
                    aria-label={`Adicionar mais um ${item.prato.nome}`}
                  >
                    +
                  </button>
                </div>

                {/* Subtotal */}
                <p className="text-sm font-semibold text-gray-900 w-16 text-right">
                  {formatarPreco(item.prato.preco * item.quantidade)}
                </p>

                {/* Botão remover */}
                <button
                  onClick={() => removerItem(item.prato.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors ml-1"
                  aria-label={`Remover ${item.prato.nome} do carrinho`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Rodapé com total e campos */}
        {estado.itens.length > 0 && (
          <div className="border-t border-gray-100 px-4 pt-4 pb-6 space-y-3">
            {/* Entregar — só aparece se o restaurante configurou taxa de entrega */}
            {taxaEntrega > 0 && (
              <>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={estado.entrega}
                      onChange={(e) => setEntrega(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-checked:bg-green-500 rounded-full transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Entregar</span>
                </label>

                {estado.entrega && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Endereço de entrega <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={estado.enderecoEntrega}
                      onChange={(e) => setEnderecoEntrega(e.target.value)}
                      placeholder="Rua, número, bairro..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                      autoFocus
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Taxa de entrega: {formatarPreco(taxaEntrega)}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Total */}
            {estado.entrega && taxaEntrega > 0 ? (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatarPreco(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Taxa de entrega</span>
                  <span>{formatarPreco(taxaEntrega)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                  <span className="text-sm font-semibold text-gray-700">Total</span>
                  <span className="text-lg font-bold text-gray-900">{formatarPreco(totalValor)}</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total</span>
                <span className="text-lg font-bold text-gray-900">{formatarPreco(totalValor)}</span>
              </div>
            )}

            {/* Campo mesa */}
            <div>
              <label
                htmlFor="campo-mesa"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Cliente <span className="text-red-500">*</span>
              </label>
              <input
                id="campo-mesa"
                ref={mesaRef}
                type="text"
                value={estado.mesa}
                onChange={(e) => {
                  setMesa(e.target.value)
                  if (erroMesa) setErroMesa('')
                }}
                placeholder="Ex: João Silva"
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${
                  erroMesa
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-gray-200 focus:ring-green-300'
                }`}
              />
              {erroMesa && (
                <p className="text-xs text-red-500 mt-1">{erroMesa}</p>
              )}
            </div>

            {/* Campo observação */}
            <div>
              <label
                htmlFor="campo-obs"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Observação (opcional)
              </label>
              <input
                id="campo-obs"
                type="text"
                value={estado.observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: sem cebola, sem glúten..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>

            {/* Copiar PIX */}
            {pixChave && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-blue-700 mb-0.5">
                      Pagar via PIX
                      {pixTipo && (
                        <span className="ml-1.5 font-normal text-blue-500">
                          · {PIX_TIPO_LABEL[pixTipo] ?? pixTipo}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-blue-900 font-mono truncate">{pixChave}</p>
                  </div>
                  <button
                    type="button"
                    onClick={copiarPix}
                    className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all ${
                      pixCopiado
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {pixCopiado ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Copiado!
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copiar
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Botão principal */}
            <button
              onClick={handleFazerPedido}
              disabled={enviando || itensPedido.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-base transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {enviando ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Abrindo WhatsApp...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Fazer pedido pelo WhatsApp
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400">
              Você será direcionado ao WhatsApp para confirmar o pedido
            </p>
          </div>
        )}
      </div>
    </>
  )
}
