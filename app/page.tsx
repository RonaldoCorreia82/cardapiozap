import Link from 'next/link'
import Image from 'next/image'

const WA_CONTATO = process.env.NEXT_PUBLIC_WHATSAPP_CONTATO
  ? `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_CONTATO}?text=${encodeURIComponent('Olá! Quero criar meu cardápio digital com o CardápioZap.')}`
  : '/admin/login'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <Hero />
      <ComoFunciona />
      <Funcionalidades />
      <Planos />
      <CTAFinal />
      <Rodape />
    </div>
  )
}

// ============================================================
// Navbar
// ============================================================
function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Image src="/cardapio_zap_logo.jpg" alt="CardápioZap" width={140} height={40} className="h-10 w-auto" priority />
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <a href="#como-funciona" className="hover:text-gray-900 transition-colors">Como funciona</a>
          <a href="#funcionalidades" className="hover:text-gray-900 transition-colors">Funcionalidades</a>
          <a href="#planos" className="hover:text-gray-900 transition-colors">Planos</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/login"
            className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            Entrar
          </Link>
          <a
            href={WA_CONTATO}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Começar grátis
          </a>
        </div>
      </div>
    </header>
  )
}

// ============================================================
// Hero
// ============================================================
function Hero() {
  return (
    <section className="bg-gradient-to-b from-green-50 to-white py-20 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <Image src="/logomarca_bca.png" alt="CardápioZap" width={600} height={172} className="w-4/5 h-auto" priority />
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          Seu cardápio digital com<br />
          <span className="text-green-600">pedidos pelo WhatsApp</span>
        </h1>
        <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
          Sem aplicativo, sem taxa por pedido. O cliente escaneia o QR Code, monta o pedido
          e envia direto para o seu WhatsApp — tudo em segundos.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={WA_CONTATO}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-xl text-base transition-colors shadow-lg shadow-green-100"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Quero meu cardápio digital
          </a>
          <Link
            href="/admin/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold px-8 py-4 rounded-xl text-base transition-colors"
          >
            Acessar meu painel
          </Link>
        </div>

        {/* Prova social simples */}
        <p className="text-xs text-gray-400 mt-8">
          Funciona em qualquer celular — sem instalação necessária
        </p>
      </div>
    </section>
  )
}

// ============================================================
// Como funciona
// ============================================================
function ComoFunciona() {
  const passos = [
    {
      numero: '1',
      titulo: 'Cadastre seu cardápio',
      descricao: 'Adicione fotos, preços e categorias pelo painel. Rápido, fácil e sem precisar de técnico.',
    },
    {
      numero: '2',
      titulo: 'Compartilhe o QR Code',
      descricao: 'Cole nas mesas, no balcão ou poste nas redes sociais. O link também pode ser enviado pelo WhatsApp.',
    },
    {
      numero: '3',
      titulo: 'Receba os pedidos',
      descricao: 'O cliente monta o pedido e envia direto para o seu WhatsApp. Sem aplicativo, sem intermediário.',
    },
  ]

  return (
    <section id="como-funciona" className="py-20 px-4 bg-green-600">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white mb-3">Como funciona</h2>
          <p className="text-green-100">Em 3 passos simples você já está recebendo pedidos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {passos.map((p) => (
            <div key={p.numero} className="text-center">
              <div className="w-14 h-14 bg-white text-green-600 rounded-2xl flex items-center justify-center text-2xl font-extrabold mx-auto mb-5">
                {p.numero}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{p.titulo}</h3>
              <p className="text-green-100 text-sm leading-relaxed">{p.descricao}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================
// Funcionalidades
// ============================================================
function Funcionalidades() {
  const itens = [
    {
      icone: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      titulo: 'Cardápio com fotos',
      descricao: 'Adicione fotos dos seus pratos para deixar o cardápio irresistível.',
    },
    {
      icone: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      ),
      titulo: 'QR Code exclusivo',
      descricao: 'Cada restaurante tem seu próprio QR Code para imprimir ou compartilhar.',
    },
    {
      icone: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      titulo: 'Pedido pelo WhatsApp',
      descricao: 'O cliente envia o pedido já formatado direto para o WhatsApp do restaurante.',
    },
    {
      icone: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      titulo: 'Painel de gestão',
      descricao: 'Controle pratos, categorias, preços e veja o histórico de pedidos.',
    },
    {
      icone: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      titulo: 'Funciona em qualquer celular',
      descricao: 'Sem instalação. O cliente acessa pelo navegador — simples assim.',
    },
    {
      icone: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      titulo: 'Link compartilhável',
      descricao: 'Envie o link do cardápio pelo WhatsApp, Instagram ou onde preferir.',
    },
    {
      icone: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      titulo: 'Carrinho inteligente',
      descricao: 'O cliente adiciona vários itens, informa o nome e confirma no WhatsApp.',
    },
    {
      icone: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      titulo: 'Opção de entrega',
      descricao: 'Configure a taxa de entrega e o cliente informa o endereço direto no pedido.',
    },
    {
      icone: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      titulo: 'Controle de Vendas',
      descricao: 'Registre vendas, veja o resumo do dia e o faturamento mensal por forma de pagamento.',
    },
    {
      icone: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      titulo: 'Gestão de Fiados',
      descricao: 'Controle clientes em débito, registre fiados e recebimentos com histórico completo.',
    },
  ]

  return (
    <section id="funcionalidades" className="py-20 px-4 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Tudo que você precisa</h2>
          <p className="text-gray-500">Funcionalidades pensadas para o dia a dia do seu negócio</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {itens.map((item) => (
            <div key={item.titulo} className="bg-white rounded-xl border border-gray-100 p-5 text-center">
              <div className="w-20 h-20 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4 mx-auto [&>svg]:w-10 [&>svg]:h-10">
                {item.icone}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">{item.titulo}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{item.descricao}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================
// Planos
// ============================================================
function Planos() {
  return (
    <section id="planos" className="py-20 px-4 bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white mb-3">Planos</h2>
          <p className="text-gray-400">Escolha o que melhor se encaixa no seu negócio</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plano Básico */}
          <div className="rounded-2xl border-2 border-gray-700 bg-gray-800 p-8 flex flex-col">
            <div className="mb-5">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Básico</span>
              <p className="text-sm text-gray-400 mt-2">
                Ideal para quem está começando e quer presença digital rapidamente.
              </p>
            </div>

            {/* Preço */}
            <div className="mb-6 pb-6 border-b border-gray-700">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">R$ 100</span>
                <span className="text-sm text-gray-400">/mês</span>
              </div>
              <p className="text-xs text-green-400 font-semibold mt-1">ou R$ 1.000/ano — economize 2 meses</p>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {[
                '30 itens cadastrados',
                'Cardápio digital com fotos',
                'QR Code exclusivo',
                '1 placa com QR Code',
                'Pedidos pelo WhatsApp',
                'Painel de gestão completo',
                'Opção de entrega com taxa',
                'Histórico de pedidos',
                'Instagram no cardápio',
                'Banners publicitários no rodapé',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            <a
              href={WA_CONTATO}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center border-2 border-green-500 text-green-400 hover:bg-green-900/30 font-bold py-3 rounded-xl transition-colors text-sm"
            >
              Quero o plano Básico
            </a>
          </div>

          {/* Plano Pro */}
          <div className="rounded-2xl border-2 border-green-500 p-8 flex flex-col relative bg-green-900/20">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-full">
              Mais completo
            </span>

            <div className="mb-5">
              <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Pro</span>
              <p className="text-sm text-gray-400 mt-2">
                Para quem quer mais capacidade e uma experiência sem anúncios.
              </p>
            </div>

            {/* Preço */}
            <div className="mb-6 pb-6 border-b border-green-800">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">R$ 150</span>
                <span className="text-sm text-gray-400">/mês</span>
              </div>
              <p className="text-xs text-green-400 font-semibold mt-1">ou R$ 1.500/ano — economize 2 meses</p>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {[
                '100 itens cadastrados',
                '3 placas com QR Code',
                'Tudo do plano Básico',
                'Instagram exibido no cardápio',
                'Sem banners de terceiros',
                'Controle de Vendas',
                'Gestão de Fiados',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            <a
              href={WA_CONTATO}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-green-500 hover:bg-green-400 text-white font-bold py-3 rounded-xl transition-colors text-sm"
            >
              Quero o plano Pro
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// CTA Final
// ============================================================
function CTAFinal() {
  return (
    <section className="py-20 px-4 bg-green-600">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Pronto para modernizar seu restaurante?
        </h2>
        <p className="text-green-100 mb-10 text-lg">
          Comece hoje e tenha seu cardápio digital funcionando em minutos.
        </p>
        <a
          href={WA_CONTATO}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-white hover:bg-gray-50 text-green-700 font-bold px-8 py-4 rounded-xl text-base transition-colors shadow-lg"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Falar com a gente no WhatsApp
        </a>
      </div>
    </section>
  )
}

// ============================================================
// Rodapé
// ============================================================
function Rodape() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center bg-white rounded-xl px-2 py-1">
          <Image src="/logomarca_bca.png" alt="CardápioZap" width={240} height={68} className="h-16 w-auto" />
        </div>
        <p className="text-xs text-center">
          Cardápio digital com pedido pelo WhatsApp para restaurantes brasileiros.
        </p>
        <Link
          href="/admin/login"
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Área do restaurante →
        </Link>
      </div>
    </footer>
  )
}
