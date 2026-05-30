'use client'

import { useState } from 'react'
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

// ============================================================
// Gera e faz download do PDF do fechamento de caixa
// usando jsPDF — 100% client-side, sem nova aba
// ============================================================
async function baixarPDF(
  nomeRestaurante: string,
  dataFormatada: string,
  horario: string,
  totalDia: number,
  porFormaDia: Record<string, number>,
  vendas: Venda[]
) {
  // Import dinâmico para não impactar bundle inicial
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pw = doc.internal.pageSize.getWidth()   // 210
  const ph = doc.internal.pageSize.getHeight()  // 297
  const mg = 18 // margem lateral
  const lw = pw - mg * 2 // largura útil

  let y = 18 // cursor vertical

  // ── Funções auxiliares ──────────────────────────────────────

  function setFont(size: number, style: 'normal' | 'bold' = 'normal', cor = '#1a1a1a') {
    doc.setFontSize(size)
    doc.setFont('helvetica', style)
    doc.setTextColor(cor)
  }

  function centralize(text: string, yPos: number, size: number, style: 'normal' | 'bold' = 'normal', cor = '#1a1a1a') {
    setFont(size, style, cor)
    doc.text(text, pw / 2, yPos, { align: 'center' })
  }

  function hrLine(yPos: number, cor = '#e5e7eb') {
    doc.setDrawColor(cor)
    doc.setLineWidth(0.3)
    doc.line(mg, yPos, pw - mg, yPos)
  }

  function box(xPos: number, yPos: number, w: number, h: number, cor: string) {
    const rgb = hexToRgb(cor)
    doc.setFillColor(rgb.r, rgb.g, rgb.b)
    doc.roundedRect(xPos, yPos, w, h, 3, 3, 'F')
  }

  function hexToRgb(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }

  // ── Cabeçalho ───────────────────────────────────────────────

  // Badge topo
  box(pw / 2 - 32, y - 4, 64, 7, '#f3f4f6')
  setFont(7, 'normal', '#9ca3af')
  doc.text('FECHAMENTO DE CAIXA', pw / 2, y, { align: 'center' })
  y += 10

  centralize(nomeRestaurante, y, 18, 'bold', '#111111')
  y += 7

  setFont(9, 'normal', '#6b7280')
  doc.text(dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1), pw / 2, y, { align: 'center' })
  y += 5
  doc.text(`Fechado às ${horario}`, pw / 2, y, { align: 'center' })
  y += 12

  hrLine(y)
  y += 10

  // ── Caixa de total ──────────────────────────────────────────

  const boxH = 30
  box(mg, y, lw, boxH, '#111111')

  setFont(8, 'normal', '#9ca3af')
  doc.text('TOTAL ARRECADADO NO DIA', pw / 2, y + 8, { align: 'center' })

  setFont(22, 'bold', '#ffffff')
  doc.text(formatarPreco(totalDia), pw / 2, y + 18, { align: 'center' })

  setFont(8, 'normal', '#9ca3af')
  doc.text(
    `${vendas.length} venda${vendas.length !== 1 ? 's' : ''} registrada${vendas.length !== 1 ? 's' : ''}`,
    pw / 2,
    y + 26,
    { align: 'center' }
  )

  y += boxH + 12

  // ── Por forma de pagamento ──────────────────────────────────

  setFont(7, 'bold', '#9ca3af')
  doc.text('POR FORMA DE PAGAMENTO', mg, y)
  y += 2
  hrLine(y, '#e5e7eb')
  y += 6

  const formasUsadas = (Object.keys(FORMAS) as FormaPagamento[]).filter(
    (f) => (porFormaDia[f] ?? 0) > 0
  )

  for (const f of formasUsadas) {
    const val = porFormaDia[f] ?? 0
    const qtd = vendas.filter((v) => v.forma_pagamento === f).length

    // Fundo da linha
    box(mg, y - 4, lw, 8, '#f9fafb')

    setFont(9, 'bold', '#374151')
    doc.text(FORMAS[f], mg + 3, y + 0.5)

    setFont(8, 'normal', '#9ca3af')
    doc.text(`${qtd}x`, mg + 35, y + 0.5)

    setFont(10, 'bold', '#111111')
    doc.text(formatarPreco(val), pw - mg - 3, y + 0.5, { align: 'right' })

    y += 11
  }

  y += 5

  // ── Vendas do dia ───────────────────────────────────────────

  setFont(7, 'bold', '#9ca3af')
  doc.text('VENDAS DO DIA', mg, y)
  y += 2
  hrLine(y, '#e5e7eb')
  y += 6

  // Cabeçalho da tabela
  box(mg, y - 3.5, lw, 7, '#f3f4f6')
  setFont(7, 'bold', '#6b7280')
  doc.text('HORA', mg + 3, y + 0.5)
  doc.text('DESCRIÇÃO', mg + 16, y + 0.5)
  doc.text('FORMA', pw - mg - 30, y + 0.5)
  doc.text('VALOR', pw - mg - 3, y + 0.5, { align: 'right' })
  y += 9

  for (const v of vendas) {
    // Quebra de página automática
    if (y > ph - 25) {
      doc.addPage()
      y = 20
    }

    const hora = new Date(v.created_at).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })

    const descricao = v.descricao ?? '—'
    const descTrunc = descricao.length > 30 ? descricao.slice(0, 28) + '…' : descricao

    setFont(8, 'normal', '#6b7280')
    doc.text(hora, mg + 3, y)

    setFont(8, 'normal', '#374151')
    doc.text(descTrunc, mg + 16, y)

    setFont(7, 'normal', '#6b7280')
    doc.text(FORMAS[v.forma_pagamento], pw - mg - 30, y)

    setFont(8, 'bold', '#111111')
    doc.text(formatarPreco(Number(v.valor)), pw - mg - 3, y, { align: 'right' })

    y += 7

    // Linha separadora fina
    doc.setDrawColor('#f3f4f6')
    doc.setLineWidth(0.2)
    doc.line(mg, y - 2, pw - mg, y - 2)
  }

  y += 10

  // ── Rodapé ─────────────────────────────────────────────────

  if (y > ph - 20) {
    doc.addPage()
    y = ph - 20
  }

  hrLine(ph - 15, '#e5e7eb')
  setFont(7, 'normal', '#9ca3af')
  doc.text('Relatório gerado automaticamente pelo CardápioZap', pw / 2, ph - 10, { align: 'center' })

  // ── Download ────────────────────────────────────────────────

  const nomeArquivo = `fechamento-${nomeRestaurante.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(nomeArquivo)
}

// ============================================================
// Componente
// ============================================================
export function FecharCaixa({ vendas, totalDia, porFormaDia, data, nomeRestaurante }: Props) {
  const [aberto, setAberto] = useState(false)
  const [gerando, setGerando] = useState(false)

  const dataFormatada = new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  async function handleGerarPDF() {
    setGerando(true)
    try {
      const horario = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
      await baixarPDF(nomeRestaurante, dataFormatada, horario, totalDia, porFormaDia, vendas)
    } finally {
      setGerando(false)
    }
  }

  return (
    <>
      {/* Botão principal */}
      <button
        onClick={() => setAberto(true)}
        disabled={vendas.length === 0}
        title={vendas.length === 0 ? 'Nenhuma venda registrada hoje' : 'Fechar caixa e baixar relatório'}
        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Fechar Caixa
      </button>

      {/* Modal de resumo */}
      {aberto && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setAberto(false)} aria-hidden="true" />

          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl max-h-[88vh] overflow-y-auto max-w-md mx-auto">

            {/* Cabeçalho do modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-900 text-base">Fechamento de Caixa</h2>
              <button onClick={() => setAberto(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">✕</button>
            </div>

            <div className="px-5 py-5 space-y-5">

              {/* Data */}
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-0.5">Data</p>
                <p className="text-sm font-semibold text-gray-900 capitalize">{dataFormatada}</p>
              </div>

              {/* Total */}
              <div className="bg-gray-900 text-white rounded-xl p-5 text-center">
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Total arrecadado</p>
                <p className="text-4xl font-extrabold tracking-tight">{formatarPreco(totalDia)}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {vendas.length} venda{vendas.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Por forma */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Por forma de pagamento</p>
                <div className="space-y-2">
                  {(Object.keys(FORMAS) as FormaPagamento[]).map((f) => {
                    const val = porFormaDia[f] ?? 0
                    const qtd = vendas.filter((v) => v.forma_pagamento === f).length
                    if (val === 0) return null
                    return (
                      <div key={f} className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CORES[f]}`}>{FORMAS[f]}</span>
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
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Vendas do dia</p>
                <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                  {vendas.map((v) => (
                    <div key={v.id} className="flex items-center gap-2 px-3 py-2.5">
                      <span className="text-xs text-gray-400 flex-shrink-0 w-10">
                        {new Date(v.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex-1 text-gray-700 truncate text-xs">{v.descricao || '—'}</span>
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

              {/* Botão download PDF */}
              <button
                onClick={handleGerarPDF}
                disabled={gerando}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {gerando ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Gerando PDF…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Baixar PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
