export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import { criarClienteServidor, criarClienteServico } from '@/lib/supabase-server'
import type { Categoria, Prato } from '@/lib/supabase'
import type { Banner } from '@/app/actions/banners'
import { CarrinhoProvider } from './components/CarrinhoProvider'
import { CarrinhoDrawer } from './components/CarrinhoDrawer'
import { PratoCard } from './components/PratoCard'
import { CarrinhoBotaoFlutuante } from './components/CarrinhoBotaoFlutuante'

type Props = {
  params: { slug: string }
  searchParams: { mesa?: string }
}

// ============================================================
// Meta tags Open Graph para pré-visualização no WhatsApp
// ============================================================
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = criarClienteServidor()

  const { data: restaurante } = await supabase
    .from('restaurantes')
    .select('nome, logo_url')
    .eq('slug', params.slug)
    .eq('ativo', true)
    .single()

  if (!restaurante) {
    return { title: 'Cardápio não encontrado' }
  }

  const descricao = `Veja o cardápio de ${restaurante.nome} e faça seu pedido pelo WhatsApp!`

  return {
    title: `Cardápio — ${restaurante.nome}`,
    description: descricao,
    openGraph: {
      title: `Cardápio — ${restaurante.nome}`,
      description: descricao,
      images: restaurante.logo_url ? [{ url: restaurante.logo_url }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Cardápio — ${restaurante.nome}`,
      description: descricao,
      images: restaurante.logo_url ? [restaurante.logo_url] : [],
    },
  }
}

// ============================================================
// Página SSR do cardápio público
// ============================================================
export default async function CardapioPage({ params, searchParams }: Props) {
  const supabase = criarClienteServidor()

  // Busca restaurante pelo slug
  const { data: restaurante } = await supabase
    .from('restaurantes')
    .select('*')
    .eq('slug', params.slug)
    .eq('ativo', true)
    .single()

  if (!restaurante) notFound()

  // Busca categorias ordenadas
  const { data: categorias } = await supabase
    .from('categorias')
    .select('*')
    .eq('restaurante_id', restaurante.id)
    .order('ordem', { ascending: true })

  // Busca pratos disponíveis
  const { data: pratos } = await supabase
    .from('pratos')
    .select('*')
    .eq('restaurante_id', restaurante.id)
    .eq('disponivel', true)
    .order('nome', { ascending: true })

  // Busca banners (service role) — falha silenciosa se chave não configurada
  let bannersData: Banner[] | null = null
  try {
    const { data } = await criarClienteServico()
      .from('banners')
      .select('*')
      .eq('ativo', true)
      .order('posicao', { ascending: true })
    bannersData = data
  } catch {
    // SUPABASE_SERVICE_ROLE_KEY não configurada — banners desabilitados
  }

  const categoriasList: Categoria[] = categorias ?? []
  const pratosList: Prato[] = pratos ?? []
  const banners: Banner[] = (bannersData ?? []).filter((b) => b.imagem_url) as Banner[]

  // Mesa pré-preenchida via query param ?mesa=X
  const mesaInicial = searchParams.mesa ?? ''

  // Agrupa pratos por categoria
  const pratosPorCategoria = categoriasList.map((cat) => ({
    categoria: cat,
    pratos: pratosList.filter((p) => p.categoria_id === cat.id),
  }))

  // Pratos sem categoria
  const pratosSemCategoria = pratosList.filter((p) => !p.categoria_id)

  return (
    <CarrinhoProvider
      restauranteId={restaurante.id}
      whatsappRestaurante={restaurante.whatsapp}
      mesaInicial={mesaInicial}
      taxaEntrega={restaurante.taxa_entrega ?? 0}
      hasBanners={restaurante.plano === 'basico' && banners.length > 0}
      pixChave={restaurante.pix ?? null}
      pixTipo={restaurante.pix_tipo ?? null}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            {/* Logo + nome */}
            <div className="flex items-center gap-3 min-w-0">
              {restaurante.logo_url && (
                <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-gray-100">
                  <Image
                    src={restaurante.logo_url}
                    alt={`Logo ${restaurante.nome}`}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">
                  {restaurante.nome}
                </h1>
                {restaurante.horario && (
                  <p className="text-xs text-gray-500 truncate">{restaurante.horario}</p>
                )}
              </div>
            </div>

            {/* Ícone do Instagram — disponível em todos os planos */}
            {restaurante.instagram && (
              <a
                href={`https://instagram.com/${restaurante.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Instagram de ${restaurante.nome}`}
                className="flex-shrink-0 text-gray-400 hover:text-pink-500 transition-colors"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            )}
          </div>

          {/* Navegação por categorias */}
          {categoriasList.length > 0 && (
            <nav className="border-t border-gray-100 overflow-x-auto">
              <div className="max-w-2xl mx-auto px-4 flex gap-1 py-2">
                {categoriasList.map((cat) => (
                  <a
                    key={cat.id}
                    href={`#cat-${cat.id}`}
                    className="whitespace-nowrap px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-full transition-colors"
                  >
                    {cat.nome}
                  </a>
                ))}
              </div>
            </nav>
          )}
        </header>

        {/* Conteúdo principal */}
        <main className={`max-w-2xl mx-auto px-4 py-6 ${restaurante.plano === 'basico' && banners.length > 0 ? 'pb-[calc(22.22vw_+_88px)]' : 'pb-6'}`}>
          {pratosPorCategoria.map(({ categoria, pratos: pratosCat }) => {
            if (pratosCat.length === 0) return null
            return (
              <section key={categoria.id} id={`cat-${categoria.id}`} className="mb-8">
                <h2 className="text-base font-bold text-gray-800 mb-3 uppercase tracking-wide">
                  {categoria.nome}
                </h2>
                <div className="flex flex-col gap-3">
                  {pratosCat.map((prato) => (
                    <PratoCard key={prato.id} prato={prato} />
                  ))}
                </div>
              </section>
            )
          })}

          {/* Pratos sem categoria agrupados no final */}
          {pratosSemCategoria.length > 0 && (
            <section className="mb-8">
              <h2 className="text-base font-bold text-gray-800 mb-3 uppercase tracking-wide">
                Outros
              </h2>
              <div className="flex flex-col gap-3">
                {pratosSemCategoria.map((prato) => (
                  <PratoCard key={prato.id} prato={prato} />
                ))}
              </div>
            </section>
          )}

          {pratosList.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">Cardápio em breve!</p>
              <p className="text-sm mt-1">O restaurante ainda está configurando os pratos.</p>
            </div>
          )}
        </main>

        {/* Banners — fixos na base da tela, apenas no plano básico */}
        {restaurante.plano === 'basico' && banners.length > 0 && (
          <footer className="fixed bottom-0 left-0 right-0 z-20 bg-gray-50 border-t border-gray-100 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] px-3 pt-2 pb-2">
            <div className="grid grid-cols-3 gap-2 max-w-2xl mx-auto">
              {banners.map((banner) => {
                const imagem = (
                  <div className="relative w-full aspect-[3/2] rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      src={banner.imagem_url!}
                      alt={`Banner ${banner.posicao}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 672px) 33vw, 224px"
                    />
                  </div>
                )

                return banner.link_url ? (
                  <a
                    key={banner.id}
                    href={banner.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:opacity-90 active:opacity-75 transition-opacity"
                  >
                    {imagem}
                  </a>
                ) : (
                  <div key={banner.id}>{imagem}</div>
                )
              })}
            </div>
          </footer>
        )}

        {/* Carrinho flutuante e drawer */}
        <CarrinhoBotaoFlutuante />
        <CarrinhoDrawer nomeRestaurante={restaurante.nome} />
      </div>
    </CarrinhoProvider>
  )
}
