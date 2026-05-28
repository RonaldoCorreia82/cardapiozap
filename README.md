# CardápioZap

SaaS de cardápio digital para restaurantes. O cliente escaneia um QR Code na mesa, monta o pedido e envia diretamente pelo WhatsApp nativo — sem servidor de mensagens, sem taxa por pedido.

## Visão geral

- **Cardápio público** (`/[slug]`): SSR, mobile-first, carrinho com Context API
- **Admin** (`/admin`): CRUD de pratos, categorias, gerador de QR Code, configurações
- **Pedidos**: salvos no Supabase como histórico após o cliente clicar em "Enviar pelo WhatsApp"
- **Stack**: Next.js 14 (App Router) + Supabase + Tailwind CSS + Vercel

---

## Setup local

### 1. Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no [Supabase](https://supabase.com) (plano gratuito funciona)
- Conta na [Vercel](https://vercel.com) (para deploy)

### 2. Clonar e instalar

```bash
git clone https://github.com/seu-usuario/cardapiozap.git
cd cardapiozap
npm install
```

### 3. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Vá em **SQL Editor** e execute todo o conteúdo do arquivo `schema.sql`
3. Vá em **Storage** e confirme que o bucket `cardapio-imagens` foi criado (público)
   - Se não foi criado automaticamente, crie manualmente com **Public bucket** ativado
4. Vá em **Settings > API** e copie:
   - `Project URL`
   - `anon public` key
   - `service_role` key (secret)

### 4. Configurar variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Edite o `.env.local` com os valores do seu projeto Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Instalar dependências extras necessárias

```bash
npm install @supabase/supabase-js @supabase/ssr qrcode.react
npm install -D @types/qrcode.react
```

### 6. Rodar localmente

```bash
npm run dev
```

Acesse em: [http://localhost:3000](http://localhost:3000)

### 7. Criar conta de restaurante

1. Acesse **Supabase > Authentication > Users > Add user** e crie um usuário com e-mail e senha
2. Acesse `http://localhost:3000/admin/login` e entre com as credenciais
3. Vá em **Configurações** e preencha os dados do restaurante
4. Crie categorias e pratos
5. Teste o cardápio em `http://localhost:3000/seu-slug`

---

## Estrutura de arquivos

```
cardapiozap/
├── app/
│   ├── [slug]/                    # Cardápio público (SSR)
│   │   ├── page.tsx
│   │   └── components/
│   │       ├── CarrinhoProvider.tsx   # Context + Reducer
│   │       ├── CarrinhoDrawer.tsx     # Drawer com itens e botão WhatsApp
│   │       ├── CarrinhoBotaoFlutuante.tsx
│   │       └── PratoCard.tsx
│   ├── admin/
│   │   ├── page.tsx               # Dashboard
│   │   ├── login/page.tsx         # Login
│   │   ├── pratos/page.tsx        # CRUD de pratos
│   │   ├── categorias/page.tsx    # CRUD de categorias
│   │   ├── qrcode/page.tsx        # Gerador de QR Code
│   │   └── configuracoes/page.tsx # Configurações do restaurante
│   └── actions/
│       └── pedidos.ts             # Server Action: registrar pedido
├── lib/
│   ├── supabase.ts                # Clientes Supabase (server/client/service)
│   ├── whatsapp.ts                # Geração do link wa.me
│   └── slug.ts                   # Geração de slug
├── middleware.ts                  # Proteção das rotas /admin
├── schema.sql                     # Schema completo do Supabase com RLS
└── .env.local.example            # Template de variáveis
```

---

## Deploy na Vercel

### Passo 1 — Preparar repositório

```bash
git init
git add .
git commit -m "chore: MVP inicial do CardápioZap"
# crie repositório no GitHub e faça o push
git remote add origin https://github.com/seu-usuario/cardapiozap.git
git push -u origin main
```

### Passo 2 — Importar na Vercel

1. Acesse [vercel.com](https://vercel.com) e clique em **Add New Project**
2. Selecione o repositório do GitHub
3. Framework Preset: **Next.js** (detectado automaticamente)
4. Clique em **Environment Variables** e adicione:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do seu projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role (secret) |
| `NEXT_PUBLIC_APP_URL` | URL do deploy (ex: `https://cardapiozap.vercel.app`) |

5. Clique em **Deploy**

### Passo 3 — Configurar domínio customizado (opcional)

1. Na Vercel, vá em **Settings > Domains**
2. Adicione seu domínio (ex: `cardapiozap.com.br`)
3. Configure os registros DNS conforme indicado
4. Atualize `NEXT_PUBLIC_APP_URL` para o domínio final

### Passo 4 — Verificar Supabase Auth URLs

1. No Supabase, vá em **Authentication > URL Configuration**
2. Adicione ao **Site URL**: `https://seu-dominio.vercel.app`
3. Adicione ao **Redirect URLs**: `https://seu-dominio.vercel.app/**`

### Passo 5 — Testar em produção

- [ ] Login admin funciona: `/admin/login`
- [ ] Criar restaurante em `/admin/configuracoes`
- [ ] Criar categorias e pratos
- [ ] Acessar cardápio público: `/seu-slug`
- [ ] Adicionar itens ao carrinho
- [ ] Botão "Fazer pedido" abre WhatsApp com mensagem formatada
- [ ] Pedido aparece no dashboard do admin
- [ ] QR Code gerado aponta para a URL correta

---

## Checklist de deploy

- [ ] `schema.sql` executado no Supabase
- [ ] Bucket `cardapio-imagens` criado como público
- [ ] Todas as 4 variáveis de ambiente configuradas na Vercel
- [ ] URL do app atualizada no Supabase Authentication
- [ ] Primeiro usuário criado no Supabase Auth
- [ ] Restaurante configurado via `/admin/configuracoes`
- [ ] Cardápio público acessível e funcionando no mobile

---

## Segurança

- Senhas gerenciadas pelo **Supabase Auth** — nenhuma senha armazenada no banco
- `SUPABASE_SERVICE_ROLE_KEY` existe apenas no servidor (Server Actions), nunca exposta ao cliente
- RLS ativo em todas as tabelas — donos só acessam seus próprios dados
- Pedidos de clientes usam `service_role` no servidor para bypass seguro do RLS

## Modelo de negócio

- **Plano Básico**: R$ 97/mês por restaurante
- Pagamentos a integrar futuramente: Stripe ou Pagar.me
- Painel master para o fundador: a ser implementado em próxima versão
