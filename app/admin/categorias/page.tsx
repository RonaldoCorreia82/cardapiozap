'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { criarClienteNavegador } from '@/lib/supabase'
import type { Categoria } from '@/lib/supabase'

export default function CategoriasPage() {
  const supabase = criarClienteNavegador()

  const [restauranteId, setRestauranteId] = useState<string | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [novoNome, setNovoNome] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editandoNome, setEditandoNome] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: rest } = await supabase
        .from('restaurantes')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!rest) return
      setRestauranteId(rest.id)
      await carregarCategorias(rest.id)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function carregarCategorias(restId: string) {
    const { data } = await supabase
      .from('categorias')
      .select('*')
      .eq('restaurante_id', restId)
      .order('ordem')
    setCategorias(data ?? [])
  }

  async function handleCriar(e: FormEvent) {
    e.preventDefault()
    if (!restauranteId || !novoNome.trim()) return

    setCarregando(true)
    setErro('')

    const ordemMaxima = categorias.length > 0
      ? Math.max(...categorias.map((c) => c.ordem)) + 1
      : 0

    const { error } = await supabase.from('categorias').insert({
      restaurante_id: restauranteId,
      nome: novoNome.trim(),
      ordem: ordemMaxima,
    })

    if (error) {
      setErro('Erro ao criar categoria. Tente novamente.')
    } else {
      setNovoNome('')
      await carregarCategorias(restauranteId)
    }

    setCarregando(false)
  }

  async function handleRenomear(catId: string) {
    if (!restauranteId || !editandoNome.trim()) return

    const { error } = await supabase
      .from('categorias')
      .update({ nome: editandoNome.trim() })
      .eq('id', catId)

    if (!error) {
      setCategorias((prev) =>
        prev.map((c) => (c.id === catId ? { ...c, nome: editandoNome.trim() } : c))
      )
      setEditandoId(null)
      setEditandoNome('')
    }
  }

  async function moverCategoria(index: number, direcao: 'cima' | 'baixo') {
    if (!restauranteId) return

    const novaLista = [...categorias]
    const targetIndex = direcao === 'cima' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= novaLista.length) return

    // Troca as posições
    const temp = novaLista[index]
    novaLista[index] = novaLista[targetIndex]
    novaLista[targetIndex] = temp

    // Reatribui ordens sequenciais
    const comNovaOrdem = novaLista.map((cat, i) => ({ ...cat, ordem: i }))
    setCategorias(comNovaOrdem)

    // Persiste no banco em paralelo
    await Promise.all(
      comNovaOrdem.map((cat) =>
        supabase.from('categorias').update({ ordem: cat.ordem }).eq('id', cat.id)
      )
    )
  }

  async function handleDeletar(catId: string) {
    if (!restauranteId) return
    await supabase.from('categorias').delete().eq('id', catId)
    setCategorias((prev) => prev.filter((c) => c.id !== catId))
    setConfirmDeleteId(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Categorias</h1>

        {/* Formulário criar nova */}
        <form onSubmit={handleCriar} className="flex gap-3 mb-6">
          <input
            type="text"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Nome da nova categoria"
            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
          />
          <button
            type="submit"
            disabled={carregando || !novoNome.trim()}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
          >
            + Adicionar
          </button>
        </form>

        {erro && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-3 py-2.5 mb-4">
            {erro}
          </div>
        )}

        {/* Lista de categorias */}
        {categorias.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
            Nenhuma categoria criada ainda.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {categorias.map((cat, index) => (
              <div
                key={cat.id}
                className="bg-white rounded-xl border border-gray-100 flex items-center gap-3 px-4 py-3"
              >
                {/* Botões de ordem */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moverCategoria(index, 'cima')}
                    disabled={index === 0}
                    className="text-gray-300 hover:text-gray-600 disabled:opacity-20 p-0.5"
                    aria-label="Mover para cima"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moverCategoria(index, 'baixo')}
                    disabled={index === categorias.length - 1}
                    className="text-gray-300 hover:text-gray-600 disabled:opacity-20 p-0.5"
                    aria-label="Mover para baixo"
                  >
                    ▼
                  </button>
                </div>

                {/* Nome (editável inline) */}
                {editandoId === cat.id ? (
                  <input
                    type="text"
                    value={editandoNome}
                    onChange={(e) => setEditandoNome(e.target.value)}
                    onBlur={() => handleRenomear(cat.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenomear(cat.id)
                      if (e.key === 'Escape') {
                        setEditandoId(null)
                        setEditandoNome('')
                      }
                    }}
                    autoFocus
                    className="flex-1 px-2 py-1 border border-green-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                ) : (
                  <span className="flex-1 text-sm font-medium text-gray-900">
                    {cat.nome}
                  </span>
                )}

                {/* Ações */}
                {editandoId !== cat.id && (
                  <>
                    <button
                      onClick={() => {
                        setEditandoId(cat.id)
                        setEditandoNome(cat.nome)
                      }}
                      className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                      aria-label="Renomear"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {confirmDeleteId === cat.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeletar(cat.id)}
                          className="text-xs text-red-600 font-semibold hover:underline"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs text-gray-400 hover:underline ml-1"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(cat.id)}
                        className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        aria-label="Excluir categoria"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4">
          Os pratos sem categoria aparecem na seção "Outros" no cardápio.
        </p>
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
