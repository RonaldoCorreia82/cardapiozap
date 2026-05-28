'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { criarClienteNavegador } from '@/lib/supabase'
import type { Restaurante } from '@/lib/supabase'
import { atualizarRestaurante, redefinirSenha } from '@/app/actions/admin'
import { MasterNav } from '../../../components/MasterNav'

export default function EditarRestaurantePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [restaurante, setRestaurante] = useState<Restaurante | null>(null)
  const [form, setForm] = useState({ nome: '', whatsapp: '', horario: '', endereco: '', instagram: '', plano: 'basico' as 'basico' | 'pro' })
  const [novaSenha, setNovaSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [carregandoSenha, setCarregandoSenha] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)
  const [msgSenha, setMsgSenha] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  useEffect(() => {
    async function carregar() {
      const supabase = criarClienteNavegador()
      const { data } = await supabase
        .from('restaurantes')
        .select('*')
        .eq('id', id)
        .single()

      if (data) {
        setRestaurante(data)
        setForm({
          nome: data.nome,
          whatsapp: data.whatsapp,
          horario: data.horario ?? '',
          endereco: data.endereco ?? '',
          instagram: data.instagram ?? '',
          plano: data.plano,
        })
      }
    }
    carregar()
  }, [id])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setCarregando(true)
    setMsg(null)

    const resultado = await atualizarRestaurante(id, {
      ...form,
      instagram: form.instagram.replace(/^@/, ''),
    })
    setMsg(
      'erro' in resultado
        ? { tipo: 'erro', texto: resultado.erro }
        : { tipo: 'sucesso', texto: 'Dados atualizados com sucesso!' }
    )
    setCarregando(false)
  }

  async function handleRedefinirSenha() {
    if (!restaurante || novaSenha.length < 6) {
      setMsgSenha({ tipo: 'erro', texto: 'A senha deve ter pelo menos 6 caracteres.' })
      return
    }
    setCarregandoSenha(true)
    setMsgSenha(null)

    const resultado = await redefinirSenha(restaurante.user_id, novaSenha)
    setMsgSenha(
      'erro' in resultado
        ? { tipo: 'erro', texto: resultado.erro }
        : { tipo: 'sucesso', texto: 'Senha redefinida com sucesso!' }
    )
    setNovaSenha('')
    setCarregandoSenha(false)
  }

  if (!restaurante) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MasterNav />
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
          Carregando...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MasterNav />
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/master" className="text-sm text-gray-400 hover:text-gray-600">
            ← Voltar
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Editar — {restaurante.nome}</h1>
        </div>

        {/* Dados do restaurante */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 mb-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Dados</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
            <input
              type="tel"
              inputMode="numeric"
              value={form.whatsapp}
              onChange={(e) =>
                setForm((p) => ({ ...p, whatsapp: e.target.value.replace(/\D/g, '') }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
            <input
              type="text"
              value={form.horario}
              onChange={(e) => setForm((p) => ({ ...p, horario: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <input
              type="text"
              value={form.endereco}
              onChange={(e) => setForm((p) => ({ ...p, endereco: e.target.value }))}
              placeholder="Rua das Flores, 123 — Centro"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
              <input
                type="text"
                value={form.instagram}
                onChange={(e) =>
                  setForm((p) => ({ ...p, instagram: e.target.value.replace(/^@/, '') }))
                }
                placeholder="restaurante.exemplo"
                className={`${inputClass} pl-7`}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plano</label>
            <select
              value={form.plano}
              onChange={(e) => setForm((p) => ({ ...p, plano: e.target.value as 'basico' | 'pro' }))}
              className={`${inputClass} bg-white`}
            >
              <option value="basico">Básico — R$ 97/mês</option>
              <option value="pro">Pro — R$ 197/mês</option>
            </select>
          </div>

          {msg && (
            <div className={`text-sm rounded-lg px-3 py-2.5 ${msg.tipo === 'sucesso' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              {msg.texto}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {carregando ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>

        {/* Redefinir senha */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
            Redefinir senha do dono
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className={inputClass}
            />
          </div>

          {msgSenha && (
            <div className={`text-sm rounded-lg px-3 py-2.5 ${msgSenha.tipo === 'sucesso' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              {msgSenha.texto}
            </div>
          )}

          <button
            type="button"
            onClick={handleRedefinirSenha}
            disabled={carregandoSenha || novaSenha.length < 6}
            className="w-full bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {carregandoSenha ? 'Redefinindo...' : 'Redefinir senha'}
          </button>
        </div>
      </main>
    </div>
  )
}

const inputClass =
  'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300'
