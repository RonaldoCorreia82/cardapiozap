'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function FiltroData({ dataAtual }: { dataAtual: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function navegar(data: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('data', data)
    router.push(`/admin/vendas?${params.toString()}`)
  }

  function diasAnterior() {
    const d = new Date(dataAtual + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    navegar(d.toISOString().slice(0, 10))
  }

  function diaSeguinte() {
    const d = new Date(dataAtual + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    const hoje = new Date().toISOString().slice(0, 10)
    if (d.toISOString().slice(0, 10) > hoje) return
    navegar(d.toISOString().slice(0, 10))
  }

  const hoje = new Date().toISOString().slice(0, 10)
  const ehHoje = dataAtual === hoje

  const labelData = new Date(dataAtual + 'T12:00:00').toLocaleDateString(
    'pt-BR',
    { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }
  )

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={diasAnterior}
        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="Dia anterior"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={dataAtual}
          max={hoje}
          onChange={(e) => navegar(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        />
        <span className="text-sm text-gray-500 hidden sm:block">{labelData}</span>
      </div>

      <button
        onClick={diaSeguinte}
        disabled={ehHoje}
        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Dia seguinte"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {!ehHoje && (
        <button
          onClick={() => navegar(hoje)}
          className="text-xs text-green-600 hover:text-green-800 font-medium transition-colors"
        >
          Hoje
        </button>
      )}
    </div>
  )
}
