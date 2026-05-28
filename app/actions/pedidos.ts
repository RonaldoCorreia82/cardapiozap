'use server'

import { criarClienteServico } from '@/lib/supabase-server'
import type { ItemPedido } from '@/lib/supabase'

type RegistrarPedidoInput = {
  restaurante_id: string
  mesa: string
  itens: ItemPedido[]
  total: number
  observacao?: string
}

type RegistrarPedidoResult =
  | { sucesso: true; id: string }
  | { erro: string }

// ============================================================
// Server Action — Registra pedido no Supabase como histórico
// IMPORTANTE: esta ação é chamada APÓS abrir o WhatsApp.
// Falha aqui não impede o envio da mensagem ao restaurante.
// Usa service role para bypass do RLS (cliente não tem sessão).
// ============================================================
export async function registrarPedido(
  input: RegistrarPedidoInput
): Promise<RegistrarPedidoResult> {
  // Validações básicas antes de gravar
  if (!input.restaurante_id || !input.mesa || input.itens.length === 0) {
    return { erro: 'Dados incompletos para registrar o pedido.' }
  }

  if (input.total <= 0) {
    return { erro: 'Total do pedido inválido.' }
  }

  try {
    // Service role ignora RLS — pedido pode vir de cliente sem autenticação
    const supabase = criarClienteServico()

    const { data, error } = await supabase
      .from('pedidos')
      .insert({
        restaurante_id: input.restaurante_id,
        mesa: input.mesa.trim(),
        itens: input.itens,
        total: input.total,
        observacao: input.observacao?.trim() || null,
        status: 'enviado',
      })
      .select('id')
      .single()

    if (error) {
      console.error('[registrarPedido] Erro Supabase:', error.message)
      return { erro: 'Não foi possível registrar o pedido. Tente novamente.' }
    }

    // Registra automaticamente na tabela de vendas como "dinheiro"
    // (o restaurante pode ajustar manualmente se necessário)
    const descricaoVenda = input.itens
      .slice(0, 3)
      .map((i) => `${i.quantidade}x ${i.nome}`)
      .join(', ')
      .concat(input.itens.length > 3 ? '…' : '')

    const { error: erroVenda } = await supabase
      .from('vendas')
      .insert({
        restaurante_id: input.restaurante_id,
        descricao: `${input.mesa.trim()} — ${descricaoVenda}`,
        valor: input.total,
        forma_pagamento: 'dinheiro',
      })

    if (erroVenda) {
      // Não bloqueia o pedido, apenas loga
      console.error('[registrarPedido] Erro ao registrar venda:', erroVenda.message)
    }

    return { sucesso: true, id: data.id }
  } catch (err) {
    console.error('[registrarPedido] Erro inesperado:', err)
    return { erro: 'Erro interno ao registrar o pedido.' }
  }
}

// ============================================================
// Server Action — Atualiza status de um pedido (uso no admin)
// ============================================================
export async function atualizarStatusPedido(
  pedidoId: string,
  novoStatus: 'enviado' | 'em_preparo' | 'pronto' | 'entregue' | 'cancelado'
): Promise<{ sucesso: true } | { erro: string }> {
  try {
    const supabase = criarClienteServico()

    const { error } = await supabase
      .from('pedidos')
      .update({ status: novoStatus })
      .eq('id', pedidoId)

    if (error) {
      return { erro: 'Não foi possível atualizar o status.' }
    }

    return { sucesso: true }
  } catch {
    return { erro: 'Erro interno ao atualizar status.' }
  }
}
