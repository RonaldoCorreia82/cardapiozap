'use client'

import { useState, useRef } from 'react'
import { formatarPreco } from '@/lib/whatsapp'
import { FORMAS, CORES, type FormaPagamento } from './constants'
import type { Venda } from './actions'

type Props = {
  vendas: Venda[]
  totalDia: number
  porFormaDia: Record<string, number>
  data: string
  nomeRestaurante: string
}

export function FecharCaixa({ vendas, totalDia, porFormaDia, data, nomeRestaurante }: Props) {
  const [aberto, setAberto] = useState(false)
  const [confirmado, setConfirmado] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  const dataFormatada = new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const horarioFechamento = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  function handleImprimir() {
    window.print()
  }

  function handleAbrir() {
    setConfirmado(false)
    setAberto(true)
  }

  if (!aberto) {
    return (
      <button
        onClick={handleAbrir}
        disabled={vendas.length === 0}
        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        title={vendas.length === 0 ? 'Nenhuma venda registrada hoje' : 'Fechar o caixa do dia'}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Fechar Caixa
      </button>
    )
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-40 print:hidden"
        onClick={() => setAberto(false)}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto max-w-md mx-auto print:fixed print:inset-0 print:translate-y-0 print:rounded-none print:shadow-none print:max-h-full print:overflow-visible"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 print:hidden">
          <h2 className="font-bold text-gray-900 text-lg">Fechamento de Caixa</h2>
          <button
            onClick={() => setAberto(false)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo imprimível */}
        <div className="px-5 py-4 space-y-5">

          {/* Confirmação antes de mostrar o relatório */}
          {!confirmado ? (
            <div className="text-center py-4 print:hidden">
              <div className="text-5xl mb-4">🏪</div>
              <h3 className="font-bold text-gray-900 text-base mb-2">
                Fechar o caixa de hoje?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Isso vai gerar um resumo do dia{' '}
                <strong>{dataFormatada}</strong> com todas as{' '}
                <strong>{vendas.length} venda{vendas.length !== 1 ? 's' : ''}</strong> registradas.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setAberto(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setConfirmado(true)}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-semibold"
                >
                  Confirmar fechamento
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* === RELATÓRIO DE FECHAMENTO === */}

              {/* Header do relatório */}
              <div className="text-center border-b border-gray-100 pb-4">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Fechamento de Caixa</p>
                <h3 className="font-bold text-gray-900 text-xl">{nomeRestaurante}</h3>
                <p className="text-sm text-gray-500 mt-1 capitalize">{dataFormatada}</p>
                <p className="text-xs text-gray-400 mt-0.5">Fechado às {horarioFechamento}</p>
              </div>

              {/* Total em destaque */}
              <div className="bg-gray-900 text-white rounded-xl p-5 text-center">
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Total arrecadado</p>
                <p className="text-4xl font-extrabold">{formatarPreco(totalDia)}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {vendas.length} venda{vendas.length !== 1 ? 's' : ''} no dia
                </p>
              </div>

              {/* Detalhamento por forma de pagamento */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                  Por forma de pagamento
                </p>
                <div className="space-y-2">
                  {(Object.keys(FORMAS) as FormaPagamento[]).map((f) => {
                    const val = porFormaDia[f] ?? 0
                    const qtd = vendas.filter((v) => v.forma_pagamento === f).length
                    if (val === 0) return null
                    return (
                      <div
                        key={f}
                        className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CORES[f]}`}>
                            {FORMAS[f]}
                          </span>
                          <span className="text-xs text-gray-400">{qtd}x</span>
                        </div>
                        <span className="font-bold text-gray-900">{formatarPreco(val)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Lista de vendas */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                  Todas as vendas
                </p>
                <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                  {vendas.map((v) => (
                    <div key={v.id} className="flex items-center gap-2 px-3 py-2.5 text-sm">
                      <span className="text-xs text-gray-400 flex-shrink-0 w-10">
                        {new Date(v.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="flex-1 text-gray-700 truncate text-xs">
                        {v.descricao || '—'}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${CORES[v.forma_pagamento]}`}>
                        {FORMAS[v.forma_pagamento]}
                      </span>
                      <span className="font-semibold text-gray-900 flex-shrink-0 text-xs w-16 text-right">
                        {formatarPreco(Number(v.valor))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rodapé */}
              <div className="text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
                Relatório gerado automaticamente pelo CardápioZap
              </div>

              {/* Botões de ação */}
              <div className="flex gap-3 print:hidden">
                <button
                  onClick={() => setAberto(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Fechar
                </button>
                <button
                  onClick={handleImprimir}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimir
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
