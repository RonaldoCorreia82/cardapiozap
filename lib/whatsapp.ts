import type { ItemPedido } from './supabase'

// ============================================================
// Normaliza número de WhatsApp para o formato exigido pelo wa.me
// Aceita: +55 71 9 9999-9999 | 71999999999 | (71) 9 9999.9999
// Retorna: 5571999999999
// ============================================================
export function normalizarWhatsapp(numero: string): string {
  // Remove tudo que não for dígito
  const apenasDigitos = numero.replace(/\D/g, '')

  // Já tem o código do país Brasil (55)
  if (apenasDigitos.startsWith('55') && apenasDigitos.length >= 12) {
    return apenasDigitos
  }

  // Adiciona o código do Brasil
  return `55${apenasDigitos}`
}

// ============================================================
// Formata o valor em reais (ex: 38.5 → "R$ 38,50")
// ============================================================
export function formatarPreco(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

const PIX_TIPO_LABEL: Record<string, string> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'E-mail',
  telefone: 'Telefone',
  aleatoria: 'Chave Aleatória',
}

// ============================================================
// Monta a mensagem de pedido exatamente no formato especificado
// ============================================================
export function montarMensagem(
  mesa: string,
  itens: ItemPedido[],
  total: number,
  observacao?: string,
  entrega?: boolean,
  enderecoEntrega?: string,
  taxaEntrega?: number,
  pixChave?: string | null,
  pixTipo?: string | null
): string {
  const separador = '————————————'

  const linhasItens = itens
    .map(
      (item) =>
        `${item.quantidade}x ${item.nome} — ${formatarPreco(
          item.preco_unitario * item.quantidade
        )}`
    )
    .join('\n')

  const subtotal = itens.reduce((acc, i) => acc + i.preco_unitario * i.quantidade, 0)
  const linhaEntrega =
    entrega && taxaEntrega && taxaEntrega > 0
      ? `\nSubtotal: ${formatarPreco(subtotal)}\nTaxa de entrega: ${formatarPreco(taxaEntrega)}`
      : ''
  const linhaEndereco =
    entrega && enderecoEntrega?.trim()
      ? `\nEndereco: ${enderecoEntrega.trim()}`
      : ''
  const linhaObs = observacao?.trim()
    ? `\nObs: ${observacao.trim()}`
    : ''
  const linhaPix = pixChave?.trim()
    ? `\n💳 PIX (${PIX_TIPO_LABEL[pixTipo ?? ''] ?? pixTipo ?? 'Chave'}): ${pixChave.trim()}`
    : ''

  return (
    `*Novo Pedido — ${mesa}*\n` +
    `${separador}\n` +
    `${linhasItens}` +
    `${linhaEntrega}\n` +
    `${separador}\n` +
    `*Total: ${formatarPreco(total)}*` +
    `${linhaEndereco}` +
    `${linhaObs}` +
    `${linhaPix}\n`
  )
}

// ============================================================
// Gera o link wa.me completo pronto para abrir no WhatsApp
// ============================================================
export function gerarLinkWhatsapp(
  whatsappRestaurante: string,
  mesa: string,
  itens: ItemPedido[],
  total: number,
  observacao?: string,
  entrega?: boolean,
  enderecoEntrega?: string,
  taxaEntrega?: number,
  pixChave?: string | null,
  pixTipo?: string | null
): string {
  const numero = normalizarWhatsapp(whatsappRestaurante)
  const mensagem = montarMensagem(mesa, itens, total, observacao, entrega, enderecoEntrega, taxaEntrega, pixChave, pixTipo)
  const textoCodificado = encodeURIComponent(mensagem)

  return `https://wa.me/${numero}?text=${textoCodificado}`
}
