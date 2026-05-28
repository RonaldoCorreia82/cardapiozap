'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { criarClienteServidor } from '@/lib/supabase-server'

// ============================================================
// Tipos
// ============================================================

export type ClienteFiado = {
  id: string
  restaurante_id: string
  nome: string
  telefone: string | null
  created_at: string
}

export type LancamentoFiado = {
  id: string
  restaurante_id: string
  cliente_id: string
  tipo: 'fiado' | 'pagamento'
  descricao: string | null
  valor: number
  created_at: string
}

export type ClienteComSaldo = ClienteFiado & {
  saldo: number
  total_fiado: number
  total_pago: number
}

// ============================================================
// Helper: retorna o restaurante do usuário logado
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

export async function buscarClientesComSaldo(): Promise<ClienteComSaldo[]> {
  const { supabase, restauranteId } = await getRestaurante()

  const [{ data: clientes }, { data: lancamentos }] = await Promise.all([
    supabase
      .from('clientes_fiado')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .order('nome', { ascending: true }),
    supabase
      .from('lancamentos_fiado')
      .select('cliente_id, tipo, valor')
      .eq('restaurante_id', restauranteId),
  ])

  const porCliente = (lancamentos ?? []).reduce<
    Record<string, { fiado: number; pago: number }>
  >((acc, l) => {
    if (!acc[l.cliente_id]) acc[l.cliente_id] = { fiado: 0, pago: 0 }
    if (l.tipo === 'fiado') acc[l.cliente_id].fiado += Number(l.valor)
    else acc[l.cliente_id].pago += Number(l.valor)
    return acc
  }, {})

  const lista = (clientes ?? []).map((c) => {
    const t = porCliente[c.id] ?? { fiado: 0, pago: 0 }
    return {
      ...(c as ClienteFiado),
      total_fiado: t.fiado,
      total_pago: t.pago,
      saldo: t.fiado - t.pago,
    }
  })

  // Maior saldo em aberto primeiro; quites por último (alfabético)
  lista.sort((a, b) => {
    if (a.saldo === 0 && b.saldo > 0) return 1
    if (b.saldo === 0 && a.saldo > 0) return -1
    return b.saldo - a.saldo
  })

  return lista
}

export async function buscarClienteDetalhe(clienteId: string): Promise<{
  cliente: ClienteFiado
  lancamentos: LancamentoFiado[]
} | null> {
  const { supabase, restauranteId } = await getRestaurante()

  const [{ data: cliente }, { data: lancamentos }] = await Promise.all([
    supabase
      .from('clientes_fiado')
      .select('*')
      .eq('id', clienteId)
      .eq('restaurante_id', restauranteId)
      .single(),
    supabase
      .from('lancamentos_fiado')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('restaurante_id', restauranteId)
      .order('created_at', { ascending: false }),
  ])

  if (!cliente) return null
  return {
    cliente: cliente as ClienteFiado,
    lancamentos: (lancamentos ?? []) as LancamentoFiado[],
  }
}

// ============================================================
// Mutações
// ============================================================

export async function criarCliente(
  formData: FormData
): Promise<{ erro?: string }> {
  const { supabase, restauranteId } = await getRestaurante()

  const nome = (formData.get('nome') as string)?.trim()
  const telefone = (formData.get('telefone') as string)?.trim() || null

  if (!nome) return { erro: 'Nome é obrigatório.' }

  const { error } = await supabase
    .from('clientes_fiado')
    .insert({ restaurante_id: restauranteId, nome, telefone })

  if (error) return { erro: 'Erro ao cadastrar cliente.' }
  revalidatePath('/admin/fiados')
  return {}
}

export async function deletarCliente(
  clienteId: string
): Promise<{ erro?: string }> {
  const { supabase, restauranteId } = await getRestaurante()

  const { error } = await supabase
    .from('clientes_fiado')
    .delete()
    .eq('id', clienteId)
    .eq('restaurante_id', restauranteId)

  if (error) return { erro: 'Erro ao excluir cliente.' }
  revalidatePath('/admin/fiados')
  return {}
}

export async function adicionarLancamento(
  clienteId: string,
  tipo: 'fiado' | 'pagamento',
  formData: FormData
): Promise<{ erro?: string }> {
  const { supabase, restauranteId } = await getRestaurante()

  const descricao = (formData.get('descricao') as string)?.trim() || null
  const valorStr = (formData.get('valor') as string)?.replace(',', '.')
  const valor = parseFloat(valorStr)

  if (!valor || valor <= 0) return { erro: 'Informe um valor válido.' }

  const { error } = await supabase.from('lancamentos_fiado').insert({
    restaurante_id: restauranteId,
    cliente_id: clienteId,
    tipo,
    descricao,
    valor,
  })

  if (error) return { erro: 'Erro ao registrar lançamento.' }
  revalidatePath(`/admin/fiados/${clienteId}`)
  revalidatePath('/admin/fiados')
  return {}
}

export async function deletarLancamento(
  lancamentoId: string,
  clienteId: string
): Promise<{ erro?: string }> {
  const { supabase, restauranteId } = await getRestaurante()

  const { error } = await supabase
    .from('lancamentos_fiado')
    .delete()
    .eq('id', lancamentoId)
    .eq('restaurante_id', restauranteId)

  if (error) return { erro: 'Erro ao excluir lançamento.' }
  revalidatePath(`/admin/fiados/${clienteId}`)
  revalidatePath('/admin/fiados')
  return {}
}
