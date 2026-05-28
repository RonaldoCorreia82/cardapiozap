'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { criarClienteServidor } from '@/lib/supabase-server'
import type { FormaPagamento } from './constants'

// ============================================================
// Tipos
// ============================================================

export type Venda = {
  id: string
  restaurante_id: string
  descricao: string | null
  valor: number
  forma_pagamento: FormaPagamento
  created_at: string
}

// ============================================================
// Helper
// ============================================================

async function getRestaurante() {
  const supabase = criarClienteServidor()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: restaurante } = await supabase
    .from('restaurantes')
    .select('id, plano')
    .eq('user_id', user.id)
    .single()

  if (!restaurante) redirect('/admin')
  return { supabase, restauranteId: restaurante.id as string }
}

// ============================================================
// Leitura
// ============================================================

export async function buscarVendasDoDia(data: string): Promise<Venda[]> {
  const { supabase, restauranteId } = await getRestaurante()

  // Intervalo do dia (00:00 → 23:59:59)
  const inicio = `${data}T00:00:00.000Z`
  const fim = `${data}T23:59:59.999Z`

  // Ajuste para horário de Brasília (UTC-3): o dia local vai de 03:00 a 26:59 UTC
  // Usamos a data como referência local e fazemos ±1 dia de margem, filtrando no JS
  const { data: vendas } = await supabase
    .from('vendas')
    .select('*')
    .eq('restaurante_id', restauranteId)
    .gte('created_at', inicio)
    .lte('created_at', fim)
    .order('created_at', { ascending: false })

  return (vendas ?? []) as Venda[]
}

export async function buscarResumoMensal(ano: number, mes: number): Promise<{
  total: number
  porForma: Record<FormaPagamento, number>
}> {
  const { supabase, restauranteId } = await getRestaurante()

  const inicio = new Date(ano, mes - 1, 1).toISOString()
  const fim = new Date(ano, mes, 0, 23, 59, 59).toISOString()

  const { data: vendas } = await supabase
    .from('vendas')
    .select('valor, forma_pagamento')
    .eq('restaurante_id', restauranteId)
    .gte('created_at', inicio)
    .lte('created_at', fim)

  const porForma: Record<FormaPagamento, number> = {
    dinheiro: 0,
    pix: 0,
    debito: 0,
    credito: 0,
    outro: 0,
  }
  let total = 0

  for (const v of vendas ?? []) {
    const forma = v.forma_pagamento as FormaPagamento
    porForma[forma] = (porForma[forma] ?? 0) + Number(v.valor)
    total += Number(v.valor)
  }

  return { total, porForma }
}

// ============================================================
// Mutações
// ============================================================

export async function registrarVenda(
  formData: FormData
): Promise<{ erro?: string }> {
  const { supabase, restauranteId } = await getRestaurante()

  const descricao = (formData.get('descricao') as string)?.trim() || null
  const valorStr = (formData.get('valor') as string)?.replace(',', '.')
  const valor = parseFloat(valorStr)
  const forma_pagamento = formData.get('forma_pagamento') as FormaPagamento

  if (!valor || valor <= 0) return { erro: 'Informe um valor válido.' }
  if (!forma_pagamento) return { erro: 'Selecione a forma de pagamento.' }

  const { error } = await supabase
    .from('vendas')
    .insert({ restaurante_id: restauranteId, descricao, valor, forma_pagamento })

  if (error) return { erro: 'Erro ao registrar venda.' }
  revalidatePath('/admin/vendas')
  return {}
}

export async function deletarVenda(
  vendaId: string
): Promise<{ erro?: string }> {
  const { supabase, restauranteId } = await getRestaurante()

  const { error } = await supabase
    .from('vendas')
    .delete()
    .eq('id', vendaId)
    .eq('restaurante_id', restauranteId)

  if (error) return { erro: 'Erro ao excluir venda.' }
  revalidatePath('/admin/vendas')
  return {}
}
