'use server'

import { criarClienteServico } from '@/lib/supabase-server'
import { normalizarWhatsapp } from '@/lib/whatsapp'

export type CriarRestauranteInput = {
  nome: string
  email: string
  senha: string
  whatsapp: string
  slug: string
  horario?: string
  endereco?: string
  instagram?: string
  plano: 'basico' | 'pro'
}

// ============================================================
// Cria conta de usuário + restaurante vinculado
// Usa service role para criar usuário sem precisar de convite
// ============================================================
export async function criarContaRestaurante(
  input: CriarRestauranteInput
): Promise<{ sucesso: true } | { erro: string }> {
  const supabase = criarClienteServico()

  // 1. Cria o usuário no Supabase Auth (já confirmado, sem e-mail)
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: input.email.trim().toLowerCase(),
    password: input.senha,
    email_confirm: true,
  })

  if (userError) {
    if (userError.message.includes('already')) {
      return { erro: 'Já existe uma conta com este e-mail.' }
    }
    return { erro: `Erro ao criar usuário: ${userError.message}` }
  }

  // 2. Cria o restaurante vinculado ao usuário criado
  const { error: restError } = await supabase.from('restaurantes').insert({
    user_id: userData.user.id,
    nome: input.nome.trim(),
    slug: input.slug.trim().toLowerCase(),
    whatsapp: normalizarWhatsapp(input.whatsapp),
    horario: input.horario?.trim() || null,
    endereco: input.endereco?.trim() || null,
    instagram: input.instagram?.trim().replace(/^@/, '') || null,
    plano: input.plano,
    ativo: true,
  })

  if (restError) {
    // Reverte: remove usuário criado para não deixar órfão
    await supabase.auth.admin.deleteUser(userData.user.id)

    if (restError.message.includes('slug')) {
      return { erro: 'Este endereço (slug) já está em uso. Escolha outro.' }
    }
    return { erro: `Erro ao criar restaurante: ${restError.message}` }
  }

  return { sucesso: true }
}

// ============================================================
// Atualiza dados de um restaurante (uso master)
// ============================================================
export async function atualizarRestaurante(
  id: string,
  dados: { nome?: string; whatsapp?: string; plano?: 'basico' | 'pro'; horario?: string; endereco?: string; instagram?: string }
): Promise<{ sucesso: true } | { erro: string }> {
  const supabase = criarClienteServico()

  const payload: Record<string, string | null> = {}
  if (dados.nome) payload.nome = dados.nome.trim()
  if (dados.whatsapp) payload.whatsapp = normalizarWhatsapp(dados.whatsapp)
  if (dados.plano) payload.plano = dados.plano
  if (dados.horario !== undefined) payload.horario = dados.horario.trim() || null
  if (dados.endereco !== undefined) payload.endereco = dados.endereco.trim() || null
  if (dados.instagram !== undefined) payload.instagram = dados.instagram.trim().replace(/^@/, '') || null

  const { error } = await supabase.from('restaurantes').update(payload).eq('id', id)
  if (error) return { erro: 'Erro ao atualizar restaurante.' }
  return { sucesso: true }
}

// ============================================================
// Ativa ou desativa um restaurante
// ============================================================
export async function toggleAtivoRestaurante(
  id: string,
  ativo: boolean
): Promise<{ sucesso: true } | { erro: string }> {
  const supabase = criarClienteServico()
  const { error } = await supabase.from('restaurantes').update({ ativo }).eq('id', id)
  if (error) return { erro: 'Erro ao atualizar status.' }
  return { sucesso: true }
}

// ============================================================
// Exclui restaurante e o usuário vinculado
// ============================================================
export async function deletarRestaurante(
  id: string,
  userId: string
): Promise<{ sucesso: true } | { erro: string }> {
  const supabase = criarClienteServico()

  const { error } = await supabase.from('restaurantes').delete().eq('id', id)
  if (error) return { erro: 'Erro ao excluir restaurante.' }

  await supabase.auth.admin.deleteUser(userId)

  return { sucesso: true }
}

// ============================================================
// Redefine a senha de um dono de restaurante
// ============================================================
export async function redefinirSenha(
  userId: string,
  novaSenha: string
): Promise<{ sucesso: true } | { erro: string }> {
  const supabase = criarClienteServico()

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: novaSenha,
  })

  if (error) return { erro: 'Erro ao redefinir senha.' }
  return { sucesso: true }
}
