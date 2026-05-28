-- ============================================================
-- CardápioZap — Schema completo do Supabase
-- Execute no SQL Editor do painel do Supabase
-- ============================================================

-- Habilita extensão para UUIDs
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABELA: restaurantes
-- ============================================================
create table public.restaurantes (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references auth.users(id) on delete cascade,
  nome           text not null,
  slug           text not null unique,
  whatsapp       text not null,          -- formato: 5571999999999
  logo_url       text,
  plano          text not null default 'basico' check (plano in ('basico', 'pro')),
  ativo          boolean not null default true,
  horario        text,                   -- ex: "Seg-Sex: 11h-22h"
  created_at     timestamptz not null default now()
);

-- ============================================================
-- TABELA: categorias
-- ============================================================
create table public.categorias (
  id             uuid primary key default uuid_generate_v4(),
  restaurante_id uuid not null references public.restaurantes(id) on delete cascade,
  nome           text not null,
  ordem          integer not null default 0,
  created_at     timestamptz not null default now()
);

-- ============================================================
-- TABELA: pratos
-- ============================================================
create table public.pratos (
  id             uuid primary key default uuid_generate_v4(),
  restaurante_id uuid not null references public.restaurantes(id) on delete cascade,
  categoria_id   uuid references public.categorias(id) on delete set null,
  nome           text not null,
  descricao      text,
  preco          numeric(10,2) not null check (preco >= 0),
  foto_url       text,
  disponivel     boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ============================================================
-- TABELA: pedidos
-- Pedidos são salvos após o cliente clicar em "Enviar pelo WhatsApp"
-- como registro histórico — o envio real ocorre pelo app nativo do cliente
-- ============================================================
create table public.pedidos (
  id             uuid primary key default uuid_generate_v4(),
  restaurante_id uuid not null references public.restaurantes(id) on delete cascade,
  mesa           text not null,
  itens          jsonb not null,         -- [{ nome, quantidade, preco_unitario }]
  total          numeric(10,2) not null,
  observacao     text,
  status         text not null default 'enviado' check (status in ('enviado', 'em_preparo', 'pronto', 'entregue', 'cancelado')),
  created_at     timestamptz not null default now()
);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
create index idx_restaurantes_slug   on public.restaurantes(slug);
create index idx_categorias_rest     on public.categorias(restaurante_id, ordem);
create index idx_pratos_rest         on public.pratos(restaurante_id);
create index idx_pratos_categoria    on public.pratos(categoria_id);
create index idx_pedidos_rest_data   on public.pedidos(restaurante_id, created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.restaurantes enable row level security;
alter table public.categorias    enable row level security;
alter table public.pratos        enable row level security;
alter table public.pedidos       enable row level security;

-- ---- RESTAURANTES ----

-- Leitura pública (cardápio acessível por qualquer um via slug)
create policy "restaurantes_leitura_publica"
  on public.restaurantes for select
  using (ativo = true);

-- Dono vê e edita apenas o próprio restaurante
create policy "restaurantes_dono_select"
  on public.restaurantes for select
  using (auth.uid() = user_id);

create policy "restaurantes_dono_update"
  on public.restaurantes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Novo restaurante criado pelo próprio usuário autenticado
create policy "restaurantes_dono_insert"
  on public.restaurantes for insert
  with check (auth.uid() = user_id);

-- ---- CATEGORIAS ----

-- Leitura pública para cardápio
create policy "categorias_leitura_publica"
  on public.categorias for select
  using (
    exists (
      select 1 from public.restaurantes r
      where r.id = restaurante_id and r.ativo = true
    )
  );

-- CRUD somente pelo dono
create policy "categorias_dono_all"
  on public.categorias for all
  using (
    exists (
      select 1 from public.restaurantes r
      where r.id = restaurante_id and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.restaurantes r
      where r.id = restaurante_id and r.user_id = auth.uid()
    )
  );

-- ---- PRATOS ----

-- Leitura pública para cardápio
create policy "pratos_leitura_publica"
  on public.pratos for select
  using (
    exists (
      select 1 from public.restaurantes r
      where r.id = restaurante_id and r.ativo = true
    )
  );

-- CRUD somente pelo dono
create policy "pratos_dono_all"
  on public.pratos for all
  using (
    exists (
      select 1 from public.restaurantes r
      where r.id = restaurante_id and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.restaurantes r
      where r.id = restaurante_id and r.user_id = auth.uid()
    )
  );

-- ---- PEDIDOS ----

-- Inserção pública (cliente final registra pedido sem conta)
create policy "pedidos_insercao_publica"
  on public.pedidos for insert
  with check (true);

-- Leitura somente pelo dono do restaurante
create policy "pedidos_dono_select"
  on public.pedidos for select
  using (
    exists (
      select 1 from public.restaurantes r
      where r.id = restaurante_id and r.user_id = auth.uid()
    )
  );

-- Atualização de status somente pelo dono
create policy "pedidos_dono_update"
  on public.pedidos for update
  using (
    exists (
      select 1 from public.restaurantes r
      where r.id = restaurante_id and r.user_id = auth.uid()
    )
  );

-- ============================================================
-- STORAGE — bucket para fotos de pratos e logos
-- Execute também no painel Supabase > Storage
-- ============================================================

-- Criar bucket público "cardapio-imagens"
-- (via painel ou via SQL abaixo se tiver permissão de service_role)
insert into storage.buckets (id, name, public)
values ('cardapio-imagens', 'cardapio-imagens', true)
on conflict do nothing;

-- Policy: qualquer um pode ler imagens
create policy "imagens_leitura_publica"
  on storage.objects for select
  using (bucket_id = 'cardapio-imagens');

-- Policy: dono autenticado pode fazer upload
create policy "imagens_upload_autenticado"
  on storage.objects for insert
  with check (
    bucket_id = 'cardapio-imagens'
    and auth.role() = 'authenticated'
  );

-- Policy: dono pode deletar apenas seus arquivos
create policy "imagens_delete_dono"
  on storage.objects for delete
  using (
    bucket_id = 'cardapio-imagens'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
