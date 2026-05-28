'use server'

import { criarClienteServico } from '@/lib/supabase-server'

export type Banner = {
  id: string
  posicao: 1 | 2 | 3
  imagem_url: string | null
  link_url: string | null
  ativo: boolean
  created_at: string
}

export async function atualizarBanner(
  posicao: 1 | 2 | 3,
  dados: { imagem_url?: string | null; link_url?: string | null; ativo?: boolean }
): Promise<{ sucesso: true } | { erro: string }> {
  const supabase = criarClienteServico()

  const { error } = await supabase
    .from('banners')
    .update(dados)
    .eq('posicao', posicao)

  if (error) return { erro: 'Erro ao salvar banner.' }
  return { sucesso: true }
}

export async function buscarBanners(): Promise<Banner[]> {
  const supabase = criarClienteServico()

  const { data } = await supabase
    .from('banners')
    .select('*')
    .order('posicao', { ascending: true })

  return (data ?? []) as Banner[]
}
