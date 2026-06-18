'use client'

import {
  createContext,
  useContext,
  useReducer,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { Prato, ItemPedido } from '@/lib/supabase'

// ============================================================
// Tipos do carrinho
// ============================================================

type ItemCarrinho = {
  prato: Prato
  quantidade: number
}

type EstadoCarrinho = {
  itens: ItemCarrinho[]
  mesa: string
  observacao: string
  drawerAberto: boolean
  entrega: boolean
  enderecoEntrega: string
}

type AcaoCarrinho =
  | { tipo: 'ADICIONAR'; prato: Prato }
  | { tipo: 'REMOVER'; pratoId: string }
  | { tipo: 'ALTERAR_QUANTIDADE'; pratoId: string; quantidade: number }
  | { tipo: 'LIMPAR' }
  | { tipo: 'SET_MESA'; mesa: string }
  | { tipo: 'SET_OBSERVACAO'; observacao: string }
  | { tipo: 'SET_ENTREGA'; entrega: boolean }
  | { tipo: 'SET_ENDERECO_ENTREGA'; enderecoEntrega: string }
  | { tipo: 'TOGGLE_DRAWER' }
  | { tipo: 'FECHAR_DRAWER' }

type ContextoCarrinho = {
  estado: EstadoCarrinho
  adicionarItem: (prato: Prato) => void
  removerItem: (pratoId: string) => void
  alterarQuantidade: (pratoId: string, quantidade: number) => void
  limparCarrinho: () => void
  setMesa: (mesa: string) => void
  setObservacao: (obs: string) => void
  setEntrega: (entrega: boolean) => void
  setEnderecoEntrega: (endereco: string) => void
  abrirDrawer: () => void
  fecharDrawer: () => void
  totalItens: number
  subtotal: number
  totalValor: number
  itensPedido: ItemPedido[]
  restauranteId: string
  whatsappRestaurante: string
  taxaEntrega: number
  hasBanners: boolean
  pixChave: string | null
  pixTipo: string | null
}

// ============================================================
// Reducer do carrinho
// ============================================================

function reducerCarrinho(
  estado: EstadoCarrinho,
  acao: AcaoCarrinho
): EstadoCarrinho {
  switch (acao.tipo) {
    case 'ADICIONAR': {
      const existente = estado.itens.find((i) => i.prato.id === acao.prato.id)
      if (existente) {
        return {
          ...estado,
          itens: estado.itens.map((i) =>
            i.prato.id === acao.prato.id
              ? { ...i, quantidade: i.quantidade + 1 }
              : i
          ),
        }
      }
      return {
        ...estado,
        itens: [...estado.itens, { prato: acao.prato, quantidade: 1 }],
      }
    }

    case 'REMOVER':
      return {
        ...estado,
        itens: estado.itens.filter((i) => i.prato.id !== acao.pratoId),
      }

    case 'ALTERAR_QUANTIDADE': {
      if (acao.quantidade <= 0) {
        return {
          ...estado,
          itens: estado.itens.filter((i) => i.prato.id !== acao.pratoId),
        }
      }
      return {
        ...estado,
        itens: estado.itens.map((i) =>
          i.prato.id === acao.pratoId ? { ...i, quantidade: acao.quantidade } : i
        ),
      }
    }

    case 'LIMPAR':
      return { ...estado, itens: [] }

    case 'SET_MESA':
      return { ...estado, mesa: acao.mesa }

    case 'SET_OBSERVACAO':
      return { ...estado, observacao: acao.observacao }

    case 'SET_ENTREGA':
      return { ...estado, entrega: acao.entrega }

    case 'SET_ENDERECO_ENTREGA':
      return { ...estado, enderecoEntrega: acao.enderecoEntrega }

    case 'TOGGLE_DRAWER':
      return { ...estado, drawerAberto: !estado.drawerAberto }

    case 'FECHAR_DRAWER':
      return { ...estado, drawerAberto: false }

    default:
      return estado
  }
}

// ============================================================
// Contexto
// ============================================================

const ContextoCarrinho = createContext<ContextoCarrinho | null>(null)

type PropsProvider = {
  children: ReactNode
  restauranteId: string
  whatsappRestaurante: string
  mesaInicial: string
  taxaEntrega: number
  hasBanners: boolean
  pixChave: string | null
  pixTipo: string | null
}

export function CarrinhoProvider({
  children,
  restauranteId,
  whatsappRestaurante,
  mesaInicial,
  taxaEntrega,
  hasBanners,
  pixChave,
  pixTipo,
}: PropsProvider) {
  const [estado, dispatch] = useReducer(reducerCarrinho, {
    itens: [],
    mesa: mesaInicial,
    observacao: '',
    drawerAberto: false,
    entrega: false,
    enderecoEntrega: '',
  })

  const adicionarItem = useCallback(
    (prato: Prato) => dispatch({ tipo: 'ADICIONAR', prato }),
    []
  )
  const removerItem = useCallback(
    (pratoId: string) => dispatch({ tipo: 'REMOVER', pratoId }),
    []
  )
  const alterarQuantidade = useCallback(
    (pratoId: string, quantidade: number) =>
      dispatch({ tipo: 'ALTERAR_QUANTIDADE', pratoId, quantidade }),
    []
  )
  const limparCarrinho = useCallback(() => dispatch({ tipo: 'LIMPAR' }), [])
  const setMesa = useCallback(
    (mesa: string) => dispatch({ tipo: 'SET_MESA', mesa }),
    []
  )
  const setObservacao = useCallback(
    (observacao: string) => dispatch({ tipo: 'SET_OBSERVACAO', observacao }),
    []
  )
  const setEntrega = useCallback(
    (entrega: boolean) => dispatch({ tipo: 'SET_ENTREGA', entrega }),
    []
  )
  const setEnderecoEntrega = useCallback(
    (enderecoEntrega: string) => dispatch({ tipo: 'SET_ENDERECO_ENTREGA', enderecoEntrega }),
    []
  )
  const abrirDrawer = useCallback(() => dispatch({ tipo: 'TOGGLE_DRAWER' }), [])
  const fecharDrawer = useCallback(
    () => dispatch({ tipo: 'FECHAR_DRAWER' }),
    []
  )

  const totalItens = estado.itens.reduce((acc, i) => acc + i.quantidade, 0)
  const subtotal = estado.itens.reduce((acc, i) => acc + i.prato.preco * i.quantidade, 0)
  const totalValor = subtotal + (estado.entrega ? taxaEntrega : 0)

  // Converte itens do carrinho para o formato do pedido
  const itensPedido: ItemPedido[] = estado.itens.map((i) => ({
    nome: i.prato.nome,
    quantidade: i.quantidade,
    preco_unitario: i.prato.preco,
  }))

  return (
    <ContextoCarrinho.Provider
      value={{
        estado,
        adicionarItem,
        removerItem,
        alterarQuantidade,
        limparCarrinho,
        setMesa,
        setObservacao,
        setEntrega,
        setEnderecoEntrega,
        abrirDrawer,
        fecharDrawer,
        totalItens,
        subtotal,
        totalValor,
        itensPedido,
        restauranteId,
        whatsappRestaurante,
        taxaEntrega,
        hasBanners,
        pixChave,
        pixTipo,
      }}
    >
      {children}
    </ContextoCarrinho.Provider>
  )
}

// ============================================================
// Hook de acesso ao carrinho
// ============================================================
export function useCarrinho(): ContextoCarrinho {
  const ctx = useContext(ContextoCarrinho)
  if (!ctx) {
    throw new Error('useCarrinho deve ser usado dentro de CarrinhoProvider')
  }
  return ctx
}
