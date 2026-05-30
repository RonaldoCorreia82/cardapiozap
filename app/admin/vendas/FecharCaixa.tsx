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
// Gera HTML completo do relatório e abre em nova aba para
// que o usuário possa "Salvar como PDF" pelo diálogo de impressão
// ============================================================
function gerarHTMLRelatorio(
  nomeRestaurante: string,
  dataFormatada: string,
  horario: string,
  totalDia: number,
  porFormaDia: Record<string, number>,
  vendas: Venda[]
): string {
  const formasUsadas = (Object.keys(FORMAS) as FormaPagamento[]).filter(
    (f) => (porFormaDia[f] ?? 0) > 0
  )

  const linhasFormas = formasUsadas
    .map((f) => {
      const val = porFormaDia[f] ?? 0
      const qtd = vendas.filter((v) => v.forma_pagamento === f).length
      return `
        <tr>
          <td style="padding:8px 0; border-bottom:1px solid #f0f0f0;">${FORMAS[f]}</td>
          <td style="padding:8px 0; border-bottom:1px solid #f0f0f0; text-align:center; color:#666;">${qtd}x</td>
          <td style="padding:8px 0; border-bottom:1px solid #f0f0f0; text-align:right; font-weight:700;">${formatarPreco(val)}</td>
        </tr>`
    })
    .join('')

  const linhasVendas = vendas
    .map((v) => {
      const hora = new Date(v.created_at).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
      return `
        <tr>
          <td style="padding:6px 0; border-bottom:1px solid #f8f8f8; color:#999; font-size:12px;">${hora}</td>
          <td style="padding:6px 0; border-bottom:1px solid #f8f8f8; font-size:12px; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${v.descricao ?? '—'}</td>
          <td style="padding:6px 0; border-bottom:1px solid #f8f8f8; text-align:center; font-size:11px; color:#666;">${FORMAS[v.forma_pagamento]}</td>
          <td style="padding:6px 0; border-bottom:1px solid #f8f8f8; text-align:right; font-weight:600; font-size:12px;">${formatarPreco(Number(v.valor))}</td>
        </tr>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Fechamento de Caixa — ${nomeRestaurante} — ${dataFormatada}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      color: #1a1a1a;
      background: #fff;
      padding: 48px 40px;
      max-width: 680px;
      margin: 0 auto;
    }
    .header { text-align: center; margin-bottom: 32px; }
    .badge {
      display: inline-block;
      background: #f0f0f0;
      color: #666;
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 12px;
    }
    .header h1 { font-size: 26px; font-weight: 800; margin-bottom: 6px; }
    .header p { font-size: 13px; color: #888; }
    .total-box {
      background: #111;
      color: #fff;
      border-radius: 16px;
      padding: 28px;
      text-align: center;
      margin-bottom: 28px;
    }
    .total-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #aaa; margin-bottom: 8px; }
    .total-valor { font-size: 44px; font-weight: 900; letter-spacing: -1px; }
    .total-sub { font-size: 13px; color: #aaa; margin-top: 8px; }
    .section { margin-bottom: 28px; }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #999;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    table { width: 100%; border-collapse: collapse; }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #f0f0f0;
      font-size: 11px;
      color: #bbb;
    }
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="badge">Fechamento de Caixa</div>
    <h1>${nomeRestaurante}</h1>
    <p style="text-transform:capitalize; margin-bottom:4px;">${dataFormatada}</p>
    <p>Fechado às ${horario}</p>
  </div>

  <div class="total-box">
    <div class="total-label">Total arrecadado no dia</div>
    <div class="total-valor">${formatarPreco(totalDia)}</div>
    <div class="total-sub">${vendas.length} venda${vendas.length !== 1 ? 's' : ''} registrada${vendas.length !== 1 ? 's' : ''}</div>
  </div>

  <div class="section">
    <div class="section-title">Por forma de pagamento</div>
    <table>
      <tbody>${linhasFormas}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Todas as vendas do dia</div>
    <table>
      <tbody>${linhasVendas}</tbody>
    </table>
  </div>

  <div class="footer">
    Relatório gerado automaticamente pelo CardápioZap
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`
}

export function FecharCaixa({ vendas, totalDia, porFormaDia, data, nomeRestaurante }: Props) {
  const [aberto, setAberto] = useState(false)
  const [gerando, setGerando] = useState(false)

  const dataFormatada = new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  function abrirModal() {
    setAberto(true)
  }

  function fecharModal() {
    setAberto(false)
  }

  function gerarPDF() {
    setGerando(true)
    const horario = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })

    const html = gerarHTMLRelatorio(
      nomeRestaurante,
      dataFormatada,
      horario,
      totalDia,
      porFormaDia,
      vendas
    )

    const janela = window.open('', '_blank', 'width=780,height=900,scrollbars=yes')
    if (!janela) {
      alert('Permita pop-ups para gerar o PDF.')
      setGerando(false)
      return
    }

    janela.document.open()
    janela.document.write(html)
    janela.document.close()

    // Pequeno delay para garantir que o CSS carregue antes do print
    setTimeout(() => setGerando(false), 600)
  }

  return (
    <>
      {/* Botão principal */}
      <button
        onClick={abrirModal}
        disabled={vendas.length === 0}
        title={vendas.length === 0 ? 'Nenhuma venda registrada hoje' : 'Fechar caixa e gerar relatório'}
        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Fechar Caixa
      </button>

      {/* Modal de confirmação + resumo */}
      {aberto && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={fecharModal}
            aria-hidden="true"
          />

          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl max-h-[88vh] overflow-y-auto max-w-md mx-auto">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-900 text-base">Fechamento de Caixa</h2>
              <button
                onClick={fecharModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-5 space-y-5">
              {/* Data */}
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-0.5">Data</p>
                <p className="text-sm font-semibold text-gray-900 capitalize">{dataFormatada}</p>
              </div>

              {/* Total do dia */}
              <div className="bg-gray-900 text-white rounded-xl p-5 text-center">
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Total arrecadado</p>
                <p className="text-4xl font-extrabold tracking-tight">{formatarPreco(totalDia)}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {vendas.length} venda{vendas.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Por forma de pagamento */}
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
                  Vendas do dia
                </p>
                <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                  {vendas.map((v) => (
                    <div key={v.id} className="flex items-center gap-2 px-3 py-2.5">
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

              {/* Botão gerar PDF */}
              <button
                onClick={gerarPDF}
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
                    Gerar PDF
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-400">
                Uma nova aba abrirá com o relatório. Use <strong>Ctrl+P</strong> → <strong>Salvar como PDF</strong>.
              </p>
            </div>
          </div>
        </>
      )}
    </>
  )
}
