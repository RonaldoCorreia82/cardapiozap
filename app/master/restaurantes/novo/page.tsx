'use client'

export const dynamic = 'force-dynamic'

import { useState, type FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { criarContaRestaurante } from '@/app/actions/admin'
import { gerarSlug } from '@/lib/slug'
import { MasterNav } from '../../components/MasterNav'

export default function NovoRestaurantePage() {
  const router = useRouter()

  const [form, setForm] = useState({
    nome: '',
    slug: '',
    whatsapp: '',
    horario: '',
    endereco: '',
    instagram: '',
    plano: 'basico' as 'basico' | 'pro',
    email: '',
    senha: '',
    confirmarSenha: '',
  })

  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  // Gera slug automático ao digitar o nome
  useEffect(() => {
    if (form.nome) {
      setForm((p) => ({ ...p, slug: gerarSlug(form.nome) }))
    }
  }, [form.nome])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')

    if (form.senha !== form.confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }
    if (form.senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (!form.whatsapp.trim()) {
      setErro('Informe o WhatsApp do restaurante.')
      return
    }
    if (!form.slug.trim()) {
      setErro('Informe o endereço (slug) do cardápio.')
      return
    }

    setCarregando(true)

    const resultado = await criarContaRestaurante({
      nome: form.nome,
      email: form.email,
      senha: form.senha,
      whatsapp: form.whatsapp,
      slug: form.slug,
      horario: form.horario,
      endereco: form.endereco,
      instagram: form.instagram,
      plano: form.plano,
    })

    if ('erro' in resultado) {
      setErro(resultado.erro)
      setCarregando(false)
      return
    }

    setSucesso(true)
    setCarregando(false)
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MasterNav />
        <main className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl border border-gray-100 p-8">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              ✓
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Restaurante cadastrado!
            </h2>
            <p className="text-sm text-gray-500 mb-1">
              <strong>{form.nome}</strong> foi criado com sucesso.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              O dono pode acessar em{' '}
              <strong>/admin/login</strong> com o e-mail{' '}
              <strong>{form.email}</strong>.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setSucesso(false)
                  setForm({
                    nome: '', slug: '', whatsapp: '', horario: '', endereco: '', instagram: '',
                    plano: 'basico', email: '', senha: '', confirmarSenha: '',
                  })
                }}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cadastrar outro
              </button>
              <Link
                href="/master"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Ver todos
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MasterNav />
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/master"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Voltar
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Novo restaurante</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dados do restaurante */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
              Dados do restaurante
            </h2>

            <Campo label="Nome do restaurante" obrigatorio>
              <input
                type="text"
                required
                value={form.nome}
                onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                placeholder="Ex: Lanchonete da Maria"
                className={inputClass}
              />
            </Campo>

            <Campo label="Endereço do cardápio (slug)" obrigatorio>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-300">
                <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-xs border-r border-gray-200 whitespace-nowrap">
                  /
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
                  placeholder="lanchonete-da-maria"
                  className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                />
              </div>
            </Campo>

            <Campo label="WhatsApp (só números)" obrigatorio>
              <input
                type="tel"
                inputMode="numeric"
                required
                value={form.whatsapp}
                onChange={(e) =>
                  setForm((p) => ({ ...p, whatsapp: e.target.value.replace(/\D/g, '') }))
                }
                placeholder="71 9 9999-9999"
                className={inputClass}
              />
            </Campo>

            <Campo label="Horário de funcionamento">
              <input
                type="text"
                value={form.horario}
                onChange={(e) => setForm((p) => ({ ...p, horario: e.target.value }))}
                placeholder="Ex: Seg-Sex 11h-22h"
                className={inputClass}
              />
            </Campo>

            <Campo label="Endereço">
              <input
                type="text"
                value={form.endereco}
                onChange={(e) => setForm((p) => ({ ...p, endereco: e.target.value }))}
                placeholder="Ex: Rua das Flores, 123 — Centro"
                className={inputClass}
              />
            </Campo>

            <Campo label="Instagram">
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
            </Campo>

            <Campo label="Plano" obrigatorio>
              <select
                value={form.plano}
                onChange={(e) =>
                  setForm((p) => ({ ...p, plano: e.target.value as 'basico' | 'pro' }))
                }
                className={`${inputClass} bg-white`}
              >
                <option value="basico">Básico — R$ 97/mês</option>
                <option value="pro">Pro — R$ 197/mês</option>
              </select>
            </Campo>
          </div>

          {/* Acesso do dono */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
              Acesso do dono
            </h2>

            <Campo label="E-mail de login" obrigatorio>
              <input
                type="email"
                required
                autoComplete="off"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="dono@restaurante.com"
                className={inputClass}
              />
            </Campo>

            <Campo label="Senha" obrigatorio>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={form.senha}
                onChange={(e) => setForm((p) => ({ ...p, senha: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
                className={inputClass}
              />
            </Campo>

            <Campo label="Confirmar senha" obrigatorio>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={form.confirmarSenha}
                onChange={(e) => setForm((p) => ({ ...p, confirmarSenha: e.target.value }))}
                placeholder="Repita a senha"
                className={inputClass}
              />
            </Campo>
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {carregando ? 'Cadastrando...' : 'Cadastrar restaurante'}
          </button>
        </form>
      </main>
    </div>
  )
}

const inputClass =
  'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300'

function Campo({
  label,
  obrigatorio,
  children,
}: {
  label: string
  obrigatorio?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {obrigatorio && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}
