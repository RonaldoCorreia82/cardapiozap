'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import Image from 'next/image'
import { criarClienteNavegador } from '@/lib/supabase'
import { atualizarBanner, buscarBanners, type Banner } from '@/app/actions/banners'
import { MasterNav } from '../components/MasterNav'

type SlotBanner = {
  posicao: 1 | 2 | 3
  imagem_url: string | null
  link_url: string
  ativo: boolean
  uploadando: boolean
  salvando: boolean
  msg: { tipo: 'sucesso' | 'erro'; texto: string } | null
}

export default function BannersPage() {
  const [slots, setSlots] = useState<SlotBanner[]>([
    { posicao: 1, imagem_url: null, link_url: '', ativo: true, uploadando: false, salvando: false, msg: null },
    { posicao: 2, imagem_url: null, link_url: '', ativo: true, uploadando: false, salvando: false, msg: null },
    { posicao: 3, imagem_url: null, link_url: '', ativo: true, uploadando: false, salvando: false, msg: null },
  ])

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  useEffect(() => {
    buscarBanners().then((banners) => {
      setSlots((prev) =>
        prev.map((slot) => {
          const banner = banners.find((b) => b.posicao === slot.posicao)
          if (!banner) return slot
          return {
            ...slot,
            imagem_url: banner.imagem_url,
            link_url: banner.link_url ?? '',
            ativo: banner.ativo,
          }
        })
      )
    })
  }, [])

  function atualizarSlot(posicao: number, patch: Partial<SlotBanner>) {
    setSlots((prev) =>
      prev.map((s) => (s.posicao === posicao ? { ...s, ...patch } : s))
    )
  }

  async function handleUpload(posicao: 1 | 2 | 3, e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return

    atualizarSlot(posicao, { uploadando: true, msg: null })

    const supabase = criarClienteNavegador()
    const extensao = arquivo.name.split('.').pop()
    const nomeArquivo = `banners/banner-${posicao}.${extensao}`

    const { data, error } = await supabase.storage
      .from('cardapio-imagens')
      .upload(nomeArquivo, arquivo, { upsert: true })

    if (error) {
      atualizarSlot(posicao, {
        uploadando: false,
        msg: { tipo: 'erro', texto: 'Erro ao fazer upload da imagem.' },
      })
      return
    }

    const { data: urlData } = supabase.storage
      .from('cardapio-imagens')
      .getPublicUrl(data.path)

    atualizarSlot(posicao, {
      imagem_url: urlData.publicUrl,
      uploadando: false,
    })
  }

  async function handleSalvar(slot: SlotBanner) {
    atualizarSlot(slot.posicao, { salvando: true, msg: null })

    const resultado = await atualizarBanner(slot.posicao, {
      imagem_url: slot.imagem_url,
      link_url: slot.link_url.trim() || null,
      ativo: slot.ativo,
    })

    atualizarSlot(slot.posicao, {
      salvando: false,
      msg:
        'erro' in resultado
          ? { tipo: 'erro', texto: resultado.erro }
          : { tipo: 'sucesso', texto: 'Banner salvo!' },
    })

    setTimeout(() => atualizarSlot(slot.posicao, { msg: null }), 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MasterNav />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Banners do cardápio</h1>
          <p className="text-sm text-gray-500 mt-1">
            3 banners exibidos na base de todos os cardápios. Tamanho recomendado: 600×200px.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {slots.map((slot, idx) => (
            <div key={slot.posicao} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">Banner {slot.posicao}</span>
                {/* Toggle ativo */}
                <button
                  onClick={() => atualizarSlot(slot.posicao, { ativo: !slot.ativo })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    slot.ativo ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  title={slot.ativo ? 'Clique para desativar' : 'Clique para ativar'}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      slot.ativo ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Pré-visualização da imagem */}
              <div className="relative w-full aspect-[3/2] rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border border-dashed border-gray-200">
                {slot.imagem_url ? (
                  <Image
                    src={slot.imagem_url}
                    alt={`Banner ${slot.posicao}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <span className="text-gray-300 text-sm">Sem imagem</span>
                )}
                {slot.uploadando && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Upload */}
              <div>
                <input
                  ref={inputRefs[idx]}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUpload(slot.posicao, e)}
                />
                <button
                  type="button"
                  onClick={() => inputRefs[idx].current?.click()}
                  disabled={slot.uploadando}
                  className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium border border-blue-100 hover:border-blue-300 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {slot.imagem_url ? 'Trocar imagem' : 'Escolher imagem'}
                </button>
              </div>

              {/* URL de destino */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Link ao clicar (URL)
                </label>
                <input
                  type="url"
                  value={slot.link_url}
                  onChange={(e) => atualizarSlot(slot.posicao, { link_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                />
                <p className="text-xs text-gray-400 mt-1">Deixe vazio para banner sem link</p>
              </div>

              {/* Mensagem de feedback */}
              {slot.msg && (
                <div
                  className={`text-xs rounded-lg px-3 py-2 ${
                    slot.msg.tipo === 'sucesso'
                      ? 'bg-green-50 text-green-700 border border-green-100'
                      : 'bg-red-50 text-red-600 border border-red-100'
                  }`}
                >
                  {slot.msg.texto}
                </div>
              )}

              <button
                onClick={() => handleSalvar(slot)}
                disabled={slot.salvando || slot.uploadando}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                {slot.salvando ? 'Salvando...' : 'Salvar banner'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-100 rounded-xl p-4">
          <p className="text-sm font-medium text-yellow-800 mb-1">Dicas</p>
          <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
            <li>Use imagens no formato JPG ou PNG com proporção 3:1 (ex: 600×200px)</li>
            <li>Os banners aparecem na base de todos os cardápios cadastrados</li>
            <li>Desative um banner sem precisar apagar a imagem</li>
            <li>O link abre em nova aba ao clicar no banner</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
