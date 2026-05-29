'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef, type ChangeEvent, type FormEvent } from 'react'
import Image from 'next/image'
import { criarClienteNavegador } from '@/lib/supabase'
import type { Prato, Categoria } from '@/lib/supabase'
import { formatarPreco } from '@/lib/whatsapp'

type FormPrato = {
  nome: string
  descricao: string
  preco: string
  categoria_id: string
  disponivel: boolean
  foto_url: string
}

const FORM_VAZIO: FormPrato = {
  nome: '',
  descricao: '',
  preco: '',
  categoria_id: '',
  disponivel: true,
  foto_url: '',
}

export default function PratosPage() {
  const supabase = criarClienteNavegador()

  const [restauranteId, setRestauranteId] = useState<string | null>(null)
  const [pratos, setPratos] = useState<Prato[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [form, setForm] = useState<FormPrato>(FORM_VAZIO)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [uploadando, setUploadando] = useState(false)
  const [erro, setErro] = useState('')
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [salvandoOrdem, setSalvandoOrdem] = useState(false)

  // Drag-and-drop
  const dragIndexRef = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const inputFotoRef = useRef<HTMLInputElement>(null)

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

      await Promise.all([carregarPratos(rest.id), carregarCategorias(rest.id)])
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function carregarPratos(restId: string) {
    const { data } = await supabase
      .from('pratos')
      .select('*')
      .eq('restaurante_id', restId)
      .order('ordem', { ascending: true, nullsFirst: false })
    // Fallback: se ordem for null em todos, mantém ordem do banco (nome)
    setPratos(data ?? [])
  }

  async function carregarCategorias(restId: string) {
    const { data } = await supabase
      .from('categorias')
      .select('*')
      .eq('restaurante_id', restId)
      .order('ordem')
    setCategorias(data ?? [])
  }

  // ============================================================
  // Drag-and-drop handlers
  // ============================================================
  function handleDragStart(e: React.DragEvent, index: number) {
    dragIndexRef.current = index
    e.dataTransfer.effectAllowed = 'move'
    // Deixa o item original um pouco transparente
    setTimeout(() => {
      const el = e.currentTarget as HTMLElement
      el.style.opacity = '0.4'
    }, 0)
  }

  function handleDragEnd(e: React.DragEvent) {
    ;(e.currentTarget as HTMLElement).style.opacity = '1'
    dragIndexRef.current = null
    setDragOver(null)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragIndexRef.current !== index) {
      setDragOver(index)
    }
  }

  function handleDragLeave() {
    setDragOver(null)
  }

  async function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault()
    const fromIndex = dragIndexRef.current
    if (fromIndex === null || fromIndex === dropIndex) {
      setDragOver(null)
      return
    }

    // Reordena localmente
    const nova = [...pratos]
    const [movido] = nova.splice(fromIndex, 1)
    nova.splice(dropIndex, 0, movido)

    setPratos(nova)
    setDragOver(null)
    dragIndexRef.current = null

    // Persiste no banco
    await salvarOrdem(nova)
  }

  async function salvarOrdem(lista: Prato[]) {
    setSalvandoOrdem(true)
    await Promise.all(
      lista.map((p, i) =>
        supabase.from('pratos').update({ ordem: i }).eq('id', p.id)
      )
    )
    setSalvandoOrdem(false)
  }

  // ============================================================
  // Modal helpers
  // ============================================================
  function abrirModalNovo() {
    setEditandoId(null)
    setForm(FORM_VAZIO)
    setFotoPreview(null)
    setErro('')
    setModalAberto(true)
  }

  function abrirModalEditar(prato: Prato) {
    setEditandoId(prato.id)
    setForm({
      nome: prato.nome,
      descricao: prato.descricao ?? '',
      preco: String(prato.preco),
      categoria_id: prato.categoria_id ?? '',
      disponivel: prato.disponivel,
      foto_url: prato.foto_url ?? '',
    })
    setFotoPreview(prato.foto_url)
    setErro('')
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setForm(FORM_VAZIO)
    setEditandoId(null)
    setFotoPreview(null)
    setErro('')
  }

  async function handleUploadFoto(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo || !restauranteId) return

    const urlLocal = URL.createObjectURL(arquivo)
    setFotoPreview(urlLocal)
    setUploadando(true)

    const extensao = arquivo.name.split('.').pop()
    const nomeArquivo = `${restauranteId}/${Date.now()}.${extensao}`

    const { data, error } = await supabase.storage
      .from('cardapio-imagens')
      .upload(nomeArquivo, arquivo, { upsert: true })

    if (error) {
      setErro('Erro ao fazer upload da foto. Tente novamente.')
      setFotoPreview(form.foto_url || null)
      setUploadando(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('cardapio-imagens')
      .getPublicUrl(data.path)

    setForm((prev) => ({ ...prev, foto_url: urlData.publicUrl }))
    setUploadando(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!restauranteId) return

    const preco = parseFloat(form.preco.replace(',', '.'))
    if (!form.nome.trim()) {
      setErro('O nome do prato é obrigatório.')
      return
    }
    if (isNaN(preco) || preco < 0) {
      setErro('Informe um preço válido.')
      return
    }

    setCarregando(true)
    setErro('')

    const payload = {
      restaurante_id: restauranteId,
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      preco,
      categoria_id: form.categoria_id || null,
      disponivel: form.disponivel,
      foto_url: form.foto_url || null,
    }

    if (editandoId) {
      const { error } = await supabase
        .from('pratos')
        .update(payload)
        .eq('id', editandoId)
      if (error) {
        setErro('Erro ao atualizar prato. Tente novamente.')
        setCarregando(false)
        return
      }
    } else {
      // Novo prato recebe a última posição
      const ordemNovo = pratos.length
      const { error } = await supabase
        .from('pratos')
        .insert({ ...payload, ordem: ordemNovo })
      if (error) {
        setErro('Erro ao cadastrar prato. Tente novamente.')
        setCarregando(false)
        return
      }
    }

    await carregarPratos(restauranteId)
    fecharModal()
    setCarregando(false)
  }

  async function handleDeletar(pratoId: string) {
    if (!restauranteId) return
    await supabase.from('pratos').delete().eq('id', pratoId)
    const nova = pratos.filter((p) => p.id !== pratoId)
    setPratos(nova)
    setConfirmDeleteId(null)
    // Reordena após remoção
    await salvarOrdem(nova)
  }

  async function toggleDisponivel(prato: Prato) {
    await supabase
      .from('pratos')
      .update({ disponivel: !prato.disponivel })
      .eq('id', prato.id)
    setPratos((prev) =>
      prev.map((p) =>
        p.id === prato.id ? { ...p, disponivel: !p.disponivel } : p
      )
    )
  }

  const categoriaNome = (id: string | null) =>
    categorias.find((c) => c.id === id)?.nome ?? '—'

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pratos</h1>
            {pratos.length > 1 && (
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <span>⠿</span> Arraste para reordenar
                {salvandoOrdem && (
                  <span className="ml-1 text-green-600">• salvando...</span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={abrirModalNovo}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + Novo prato
          </button>
        </div>

        {/* Lista de pratos com drag-and-drop */}
        {pratos.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
            Nenhum prato cadastrado. Clique em &quot;Novo prato&quot; para começar.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {pratos.map((prato, index) => (
              <div
                key={prato.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={`bg-white rounded-xl border flex items-center gap-3 p-3 transition-all duration-150 ${
                  dragOver === index
                    ? 'border-green-400 shadow-md scale-[1.01] bg-green-50'
                    : 'border-gray-100'
                }`}
              >
                {/* Handle de arraste */}
                <div
                  className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 px-1 flex-shrink-0 select-none"
                  title="Arraste para reordenar"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <circle cx="7" cy="5" r="1.5" />
                    <circle cx="13" cy="5" r="1.5" />
                    <circle cx="7" cy="10" r="1.5" />
                    <circle cx="13" cy="10" r="1.5" />
                    <circle cx="7" cy="15" r="1.5" />
                    <circle cx="13" cy="15" r="1.5" />
                  </svg>
                </div>

                {/* Foto miniatura */}
                {prato.foto_url ? (
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={prato.foto_url}
                      alt={prato.nome}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-xl">
                    🍽️
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {prato.nome}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {categoriaNome(prato.categoria_id)}
                  </p>
                  <p className="text-sm font-bold text-green-700 mt-0.5">
                    {formatarPreco(prato.preco)}
                  </p>
                </div>

                {/* Toggle disponível */}
                <button
                  onClick={() => toggleDisponivel(prato)}
                  title={prato.disponivel ? 'Marcar como indisponível' : 'Marcar como disponível'}
                  className={`text-xs px-2 py-1 rounded-full font-medium transition-colors flex-shrink-0 ${
                    prato.disponivel
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {prato.disponivel ? 'Disponível' : 'Indisp.'}
                </button>

                <button
                  onClick={() => abrirModalEditar(prato)}
                  className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors flex-shrink-0"
                  aria-label="Editar prato"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>

                {confirmDeleteId === prato.id ? (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleDeletar(prato.id)}
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
                    onClick={() => setConfirmDeleteId(prato.id)}
                    className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                    aria-label="Excluir prato"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de criação/edição */}
      {modalAberto && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={fecharModal}
            aria-hidden="true"
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto max-w-lg mx-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-900">
                {editandoId ? 'Editar prato' : 'Novo prato'}
              </h2>
              <button
                onClick={fecharModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              {/* Foto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto do prato
                </label>
                <div className="flex items-start gap-3">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                    {fotoPreview ? (
                      <Image
                        src={fotoPreview}
                        alt="Pré-visualização"
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <span className="text-3xl">🍽️</span>
                    )}
                    {uploadando && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      ref={inputFotoRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadFoto}
                    />
                    <button
                      type="button"
                      onClick={() => inputFotoRef.current?.click()}
                      disabled={uploadando}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                    >
                      {fotoPreview ? 'Trocar foto' : 'Escolher foto'}
                    </button>
                    <p className="text-xs text-gray-400 mt-1">
                      JPG, PNG ou WebP até 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.nome}
                  onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                  placeholder="Ex: Frango grelhado com arroz"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={form.descricao}
                  onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
                  placeholder="Ingredientes, acompanhamentos, modo de preparo..."
                />
              </div>

              {/* Preço */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço (R$) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={form.preco}
                  onChange={(e) => setForm((p) => ({ ...p, preco: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                  placeholder="Ex: 28,90"
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={form.categoria_id}
                  onChange={(e) => setForm((p) => ({ ...p, categoria_id: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
                >
                  <option value="">Sem categoria</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Disponível */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.disponivel}
                  onClick={() => setForm((p) => ({ ...p, disponivel: !p.disponivel }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.disponivel ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      form.disponivel ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-700">
                  {form.disponivel ? 'Disponível no cardápio' : 'Oculto do cardápio'}
                </span>
              </div>

              {erro && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-3 py-2.5">
                  {erro}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={carregando || uploadando}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  {carregando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Cadastrar prato'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
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
