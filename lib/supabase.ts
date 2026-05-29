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
// URL e anon key são valores PÚBLICOS (seguro ter no código-fonte)
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://tkuuwjgokgaveiskfdyj.supabase.co'

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrdXV3amdva2dhdmVpc2tmZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MTQxMzIsImV4cCI6MjA5NTQ5MDEzMn0.UMZyOZIduxW3LLXY8fNsLmJyHobtv1UxO0hgPMTe4ss'

export function criarClienteNavegador() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
