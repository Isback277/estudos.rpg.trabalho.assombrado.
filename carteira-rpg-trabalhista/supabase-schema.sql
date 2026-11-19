-- Estrutura inicial para a versão online (Supabase / PostgreSQL).
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Jogador',
  created_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  owner_id uuid not null references auth.users(id) on delete cascade,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.campaign_members (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'player' check (role in ('owner','player')),
  joined_at timestamptz not null default now(),
  primary key (campaign_id,user_id)
);

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  name text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.creatures (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  name text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.combat_logs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  entry jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;
alter table public.characters enable row level security;
alter table public.creatures enable row level security;
alter table public.combat_logs enable row level security;

-- Perfil: cada pessoa lê e altera o próprio perfil.
create policy "profile self read" on public.profiles for select using (auth.uid() = id);
create policy "profile self insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profile self update" on public.profiles for update using (auth.uid() = id);

-- Campanhas: o mestre administra; membros podem visualizar.
create policy "campaign members read" on public.campaigns for select
using (owner_id = auth.uid() or exists (
  select 1 from public.campaign_members m
  where m.campaign_id = id and m.user_id = auth.uid()
));
create policy "owner creates campaign" on public.campaigns for insert with check (owner_id = auth.uid());
create policy "owner updates campaign" on public.campaigns for update using (owner_id = auth.uid());
create policy "owner deletes campaign" on public.campaigns for delete using (owner_id = auth.uid());

-- Associação: usuário vê a própria associação; mestre administra membros.
create policy "members read own or owner" on public.campaign_members for select
using (user_id = auth.uid() or exists (
  select 1 from public.campaigns c where c.id = campaign_id and c.owner_id = auth.uid()
));
create policy "user joins campaign" on public.campaign_members for insert with check (
  user_id = auth.uid() and exists (select 1 from public.campaigns c where c.id = campaign_id)
);
create policy "owner removes member" on public.campaign_members for delete using (
  exists (select 1 from public.campaigns c where c.id = campaign_id and c.owner_id = auth.uid())
  or user_id = auth.uid()
);

-- Personagens: dono e mestre da campanha podem ler; dono administra.
create policy "character read" on public.characters for select using (
  owner_id = auth.uid() or (campaign_id is not null and exists (
    select 1 from public.campaigns c where c.id = campaign_id and c.owner_id = auth.uid()
  ))
);
create policy "character insert own" on public.characters for insert with check (owner_id = auth.uid());
create policy "character update own" on public.characters for update using (owner_id = auth.uid());
create policy "character delete own" on public.characters for delete using (owner_id = auth.uid());

-- Criaturas: mestre/dono administra e consulta.
create policy "creature read" on public.creatures for select using (
  owner_id = auth.uid() or (campaign_id is not null and exists (
    select 1 from public.campaigns c where c.id = campaign_id and c.owner_id = auth.uid()
  ))
);
create policy "creature insert own" on public.creatures for insert with check (owner_id = auth.uid());
create policy "creature update own" on public.creatures for update using (owner_id = auth.uid());
create policy "creature delete own" on public.creatures for delete using (owner_id = auth.uid());

create policy "combat log read" on public.combat_logs for select using (
  actor_id = auth.uid() or (campaign_id is not null and exists (
    select 1 from public.campaign_members m where m.campaign_id = campaign_id and m.user_id = auth.uid()
  ))
);
create policy "combat log insert" on public.combat_logs for insert with check (actor_id = auth.uid());
create policy "combat log delete" on public.combat_logs for delete using (actor_id = auth.uid());
