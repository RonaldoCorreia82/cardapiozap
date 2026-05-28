import { createBrowserClient } from '@supabase/ssr'

// ============================================================
// Tipos do banco de dados
// ============================================================

export type Restaurante = {
  id: string
  user_id: string
  nome: string
  slug: string
  whatsapp: string
  logo_url: string | null
  plano: 'basico' | 'pro'
  ativo: boolean
  horario: string | null
  endereco: string | null
  instagram: string | null
  taxa_entrega: number
  pix: string | null
  created_at: string
}

export type Categoria = {
  id: string
  restaurante_id: string
  nome: string
  ordem: number
  created_at: string
}

export type Prato = {
  id: string
  restaurante_id: string
  categoria_id: string | null
  nome: string
  descricao: string | null
  preco: number
  foto_url: string | null
  disponivel: boolean
  created_at: string
}

export type ItemPedido = {
  nome: string
  quantidade: number
  preco_unitario: number
}

export type Pedido = {
  id: string
  restaurante_id: string
  mesa: string
  itens: ItemPedido[]
  total: number
  observacao: string | null
  status: 'enviado' | 'em_preparo' | 'pronto' | 'entregue' | 'cancelado'
  created_at: string
}

// ============================================================
// Cliente para uso no navegador (Client Components)
// Usa createBrowserClient do @supabase/ssr para sincronizar
// a sessão via cookies — necessário para o middleware ler a sessão
// ============================================================
export function criarClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
