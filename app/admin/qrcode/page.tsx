'use client'

import { useEffect, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { criarClienteNavegador } from '@/lib/supabase'

export default function QRCodePage() {
  const supabase = criarClienteNavegador()

  const [slug, setSlug] = useState<string | null>(null)
  const [mesa, setMesa] = useState('')
  const [dominio, setDominio] = useState('')
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDominio(window.location.origin)

    async function carregarSlug() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: rest } = await supabase
        .from('restaurantes')
        .select('slug')
        .eq('user_id', user.id)
        .single()

      if (rest) setSlug(rest.slug)
    }

    carregarSlug()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const urlCardapio = slug
    ? `${dominio}/${slug}${mesa.trim() ? `?mesa=${encodeURIComponent(mesa.trim())}` : ''}`
    : ''

  function handleImprimir() {
    if (!urlCardapio) return

    const janela = window.open('', '_blank')
    if (!janela) return

    const canvas = qrRef.current?.querySelector('canvas')
    const dataUrl = canvas?.toDataURL('image/png') ?? ''
    const mesaLabel = mesa.trim() ? `Mesa ${mesa.trim()}` : 'Cardápio digital'

    janela.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code — ${mesaLabel}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: white;
            }
            img { width: 300px; height: 300px; }
            h1 { font-size: 28px; margin: 24px 0 8px; color: #111; }
            p { color: #666; font-size: 14px; text-align: center; margin: 0; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" alt="QR Code" />
          <h1>${mesaLabel}</h1>
          <p>Escaneie para ver o cardápio e fazer seu pedido</p>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `)
    janela.document.close()
  }

  function handleDownload() {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `qrcode-mesa-${mesa || 'geral'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Gerador de QR Code</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Configuração */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 text-sm">Configurar</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número da mesa
              </label>
              <input
                type="text"
                value={mesa}
                onChange={(e) => setMesa(e.target.value)}
                placeholder="Ex: 5 (deixe vazio para QR geral)"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              />
              <p className="text-xs text-gray-400 mt-1">
                Quando o cliente escanear, a mesa já virá preenchida automaticamente.
              </p>
            </div>

            {urlCardapio && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL gerada
                </label>
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600 break-all border border-gray-100">
                  {urlCardapio}
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleImprimir}
                disabled={!urlCardapio}
                className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir QR Code
              </button>
              <button
                onClick={handleDownload}
                disabled={!urlCardapio}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Baixar como PNG
              </button>
            </div>
          </div>

          {/* Pré-visualização do QR */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col items-center justify-center gap-4">
            {!slug ? (
              <p className="text-sm text-gray-400 text-center">
                Configure seu restaurante primeiro para gerar QR codes.
              </p>
            ) : (
              <>
                <div ref={qrRef} className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <QRCodeCanvas
                    value={urlCardapio}
                    size={200}
                    level="H"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#111827"
                  />
                </div>
                {mesa.trim() && (
                  <p className="text-lg font-bold text-gray-900">
                    Mesa {mesa.trim()}
                  </p>
                )}
                <p className="text-xs text-gray-400 text-center max-w-48">
                  Escaneie para ver o cardápio e fazer seu pedido pelo WhatsApp
                </p>
              </>
            )}
          </div>
        </div>

        {/* Dica de uso */}
        <div className="mt-6 bg-yellow-50 border border-yellow-100 rounded-xl p-4">
          <p className="text-sm font-medium text-yellow-800 mb-1">
            Como usar
          </p>
          <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
            <li>Gere um QR Code diferente para cada mesa</li>
            <li>Imprima e cole em um suporte de mesa ou plastifique</li>
            <li>O cliente escaneia, vê o cardápio e envia o pedido direto pelo WhatsApp</li>
            <li>O número da mesa já vem preenchido automaticamente</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

function AdminNav() {
  const links = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/pratos', label: 'Pratos' },
    { href: '/admin/categorias', label: 'Categorias' },
    { href: '/admin/qrcode', label: 'QR Code' },
    { href: '/admin/configuracoes', label: 'Config' },
  ]
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-20">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <a href="/admin" className="font-bold text-gray-900">
          <span className="text-green-600">⚡</span> CardápioZap
        </a>
        <div className="flex items-center gap-1 overflow-x-auto">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
}
