'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef, type FormEvent, type ChangeEvent } from 'react'
import Image from 'next/image'
import { criarClienteNavegador } from '@/lib/supabase'
import type { Restaurante } from '@/lib/supabase'
import { AdminNav } from '@/app/admin/components/AdminNav'
import { gerarSlug } from '@/lib/slug'
import { normalizarWhatsapp } from '@/lib/whatsapp'

const PIX_TIPOS = [
  { valor: 'cpf', label: 'CPF' },
  { valor: 'cnpj', label: 'CNPJ' },
  { valor: 'email', label: 'E-mail' },
  { valor: 'telefone', label: 'Telefone' },
  { valor: 'aleatoria', label: 'Chave Aleatória' },
]

type FormConfig = {
  nome: string
  whatsapp: string
  horario: string
  endereco: string
  taxa_entrega: string
  pix: string
  pix_tipo: string
  instagram: string
  logo_url: string
  slug: string
}

export default function ConfiguracoesPage() {
  const supabase = criarClienteNavegador()

  const [restaurante, setRestaurante] = useState<Restaurante | null>(null)
  const [form, setForm] = useState<FormConfig>({
    nome: '',
    whatsapp: '',
    horario: '',
    endereco: '',
    taxa_entrega: '',
    pix: '',
    pix_tipo: 'cpf',
    instagram: '',
    logo_url: '',
    slug: '',
  })
  const [carregando, setCarregando] = useState(false)
  const [uploadando, setUploadando] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)
  const [primeroCadastro, setPrimeiroCadastro] = useState(false)

  const inputLogoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function carregarDados() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: rest } = await supabase
        .from('restaurantes')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (rest) {
        setRestaurante(rest)
        setForm({
          nome: rest.nome,
          whatsapp: rest.whatsapp,
          horario: rest.horario ?? '',
          endereco: rest.endereco ?? '',
          taxa_entrega: rest.taxa_entrega > 0 ? String(rest.taxa_entrega) : '',
          pix: rest.pix ?? '',
          pix_tipo: rest.pix_tipo ?? 'cpf',
          instagram: rest.instagram ?? '',
          logo_url: rest.logo_url ?? '',
          slug: rest.slug,
        })
        setLogoPreview(rest.logo_url)
      } else {
        // Primeiro acesso — sem restaurante ainda
        setPrimeiroCadastro(true)
      }
    }
    carregarDados()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Gera slug automático ao digitar o nome (apenas na criação)
  useEffect(() => {
    if (primeroCadastro && form.nome) {
      setForm((prev) => ({ ...prev, slug: gerarSlug(form.nome) }))
    }
  }, [form.nome, primeroCadastro])

  async function handleUploadLogo(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return

    const urlLocal = URL.createObjectURL(arquivo)
    setLogoPreview(urlLocal)
    setUploadando(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const extensao = arquivo.name.split('.').pop()
    const nomeArquivo = `${user.id}/logo.${extensao}`

    const { data, error } = await supabase.storage
      .from('cardapio-imagens')
      .upload(nomeArquivo, arquivo, { upsert: true })

    if (error) {
      console.error('[Upload logo] Erro:', error.message, error.cause, JSON.stringify(error))
      setMensagem({ tipo: 'erro', texto: `Upload falhou: ${error.message}` })
      setLogoPreview(form.logo_url || null)
      setUploadando(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('cardapio-imagens')
      .getPublicUrl(data.path)

    setForm((prev) => ({ ...prev, logo_url: urlData.publicUrl }))
    setUploadando(false)
  }

  // Aplica máscara de WhatsApp ao digitar
  function handleWhatsappChange(valor: string) {
    // Mantém apenas dígitos e os caracteres de formatação
    const apenasDigitos = valor.replace(/\D/g, '')
    setForm((prev) => ({ ...prev, whatsapp: apenasDigitos }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setMensagem(null)

    if (!form.nome.trim()) {
      setMensagem({ tipo: 'erro', texto: 'O nome do restaurante é obrigatório.' })
      return
    }
    if (!form.whatsapp.trim()) {
      setMensagem({ tipo: 'erro', texto: 'O número do WhatsApp é obrigatório.' })
      return
    }
    if (!form.slug.trim()) {
      setMensagem({ tipo: 'erro', texto: 'O slug (endereço) é obrigatório.' })
      return
    }

    setCarregando(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      nome: form.nome.trim(),
      whatsapp: normalizarWhatsapp(form.whatsapp),
      horario: form.horario.trim() || null,
      endereco: form.endereco.trim() || null,
      taxa_entrega: parseFloat(form.taxa_entrega.replace(',', '.')) || 0,
      pix: form.pix.trim() || null,
      pix_tipo: form.pix.trim() ? form.pix_tipo : null,
      instagram: form.instagram.trim().replace(/^@/, '') || null,
      logo_url: form.logo_url || null,
      slug: form.slug.trim().toLowerCase(),
    }

    let error

    if (restaurante) {
      // Atualiza restaurante existente
      const result = await supabase
        .from('restaurantes')
        .update(payload)
        .eq('id', restaurante.id)
      error = result.error
    } else {
      // Cria novo restaurante
      const result = await supabase.from('restaurantes').insert({
        ...payload,
        user_id: user.id,
        plano: 'basico',
        ativo: true,
      })
      error = result.error
    }

    if (error) {
      const msgSlug = error.message.includes('slug')
        ? 'Este endereço (slug) já está em uso. Escolha outro.'
        : 'Erro ao salvar configurações. Tente novamente.'
      setMensagem({ tipo: 'erro', texto: msgSlug })
    } else {
      setMensagem({ tipo: 'sucesso', texto: 'Configurações salvas com sucesso!' })
      setPrimeiroCadastro(false)
    }

    setCarregando(false)
  }



  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">
          {primeroCadastro ? 'Configurar restaurante' : 'Configurações'}
        </h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo do restaurante</label>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-200">
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt="Logo"
                    fill
                    className="object-cover"
                    sizes="80px"
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
                  ref={inputLogoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadLogo}
                />
                <button
                  type="button"
                  onClick={() => inputLogoRef.current?.click()}
                  disabled={uploadando}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                >
                  {logoPreview ? 'Trocar logo' : 'Escolher logo'}
                </button>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG ou WebP</p>
              </div>
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do restaurante <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.nome}
              onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="Ex: Restaurante do João"
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp (apenas números) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                +55
              </span>
              <input
                type="tel"
                inputMode="numeric"
                required
                value={form.whatsapp}
                onChange={(e) => handleWhatsappChange(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                placeholder="71 9 9999-9999"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Número que receberá os pedidos no WhatsApp
            </p>
          </div>

          {/* Horário de funcionamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Horário de funcionamento
            </label>
            <input
              type="text"
              value={form.horario}
              onChange={(e) => setForm((p) => ({ ...p, horario: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="Ex: Seg-Sex: 11h-22h | Sáb-Dom: 11h-23h"
            />
          </div>

          {/* Endereço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endereço
            </label>
            <input
              type="text"
              value={form.endereco}
              onChange={(e) => setForm((p) => ({ ...p, endereco: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="Ex: Rua das Flores, 123 — Centro"
            />
          </div>

          {/* Taxa de entrega */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Taxa de entrega
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">R$</span>
              <input
                type="text"
                inputMode="decimal"
                value={form.taxa_entrega}
                onChange={(e) =>
                  setForm((p) => ({ ...p, taxa_entrega: e.target.value.replace(/[^0-9,.]/g, '') }))
                }
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                placeholder="0,00"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Valor cobrado ao cliente que escolher entrega. Deixe vazio para não cobrar.
            </p>
          </div>

          {/* PIX */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chave PIX
            </label>
            {/* Tipo de chave */}
            <div className="flex flex-wrap gap-2 mb-2">
              {PIX_TIPOS.map((t) => (
                <label
                  key={t.valor}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                    form.pix_tipo === t.valor
                      ? 'bg-green-50 border-green-400 text-green-700 font-semibold'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="pix_tipo"
                    value={t.valor}
                    checked={form.pix_tipo === t.valor}
                    onChange={() => setForm((p) => ({ ...p, pix_tipo: t.valor }))}
                    className="sr-only"
                  />
                  {t.label}
                </label>
              ))}
            </div>
            <input
              type="text"
              value={form.pix}
              onChange={(e) => setForm((p) => ({ ...p, pix: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder={
                form.pix_tipo === 'cpf' ? '000.000.000-00' :
                form.pix_tipo === 'cnpj' ? '00.000.000/0000-00' :
                form.pix_tipo === 'email' ? 'seu@email.com' :
                form.pix_tipo === 'telefone' ? '+55 (00) 00000-0000' :
                'Chave aleatória (UUID)'
              }
            />
            <p className="text-xs text-gray-400 mt-1">
              Aparece com botão &quot;Copiar PIX&quot; no checkout do cardápio.
            </p>
          </div>

          {/* Instagram */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instagram
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
              <input
                type="text"
                value={form.instagram}
                onChange={(e) =>
                  setForm((p) => ({ ...p, instagram: e.target.value.replace(/^@/, '') }))
                }
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                placeholder="restaurante.exemplo"
              />
            </div>
          </div>

          {/* Slug / endereço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endereço do cardápio <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-300">
              <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-200 whitespace-nowrap">
                cardapiozap.com.br/
              </span>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                  }))
                }
                className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                placeholder="restaurante-do-joao"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Use apenas letras minúsculas, números e hifens
            </p>
          </div>

          {mensagem && (
            <div
              className={`text-sm rounded-lg px-4 py-3 ${
                mensagem.tipo === 'sucesso'
                  ? 'bg-green-50 border border-green-100 text-green-700'
                  : 'bg-red-50 border border-red-100 text-red-600'
              }`}
            >
              {mensagem.texto}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando || uploadando}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {carregando
              ? 'Salvando...'
              : primeroCadastro
                ? 'Criar restaurante'
                : 'Salvar configurações'}
          </button>
        </form>
      </main>
    </div>
  )
}

