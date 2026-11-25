-- ============================================================================
-- Reportes de mantenimiento UTVT · Esquema de Supabase
-- Ejecutar completo en Supabase > SQL Editor > New query > Run
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Perfiles y roles
--    reportante    : estudiante o personal administrativo; solo ve sus reportes
--    mantenimiento : ve todos los reportes y cambia su estado
--    admin         : igual que mantenimiento
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null check (char_length(full_name) between 3 and 80),
  role       text not null default 'reportante'
             check (role in ('reportante', 'mantenimiento', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ¿El usuario actual es personal de mantenimiento o administrador?
-- security definer para que la consulta no dependa de las políticas de profiles.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('mantenimiento', 'admin')
  );
$$;

drop policy if exists "perfil propio o personal" on public.profiles;
create policy "perfil propio o personal" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_staff());
-- No hay políticas de insert/update/delete: el perfil lo crea el trigger y el
-- rol solo se cambia desde el panel de Supabase (nadie puede subirse de rol).

-- Crea el perfil automáticamente al registrarse. El rol siempre empieza como
-- 'reportante', aunque la app intente mandar otro.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. Reportes
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category    text not null
              check (category in ('computo', 'iluminacion', 'mobiliario', 'internet', 'electrica', 'otro')),
  location    text not null check (char_length(trim(location)) between 3 and 120),
  description text not null check (char_length(trim(description)) between 10 and 1000),
  status      text not null default 'abierto'
              check (status in ('abierto', 'en_proceso', 'resuelto')),
  photo_path  text check (photo_path is null or photo_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists reports_user_created_idx on public.reports (user_id, created_at desc);

alter table public.reports enable row level security;

drop policy if exists "ver reportes propios o todos si es personal" on public.reports;
create policy "ver reportes propios o todos si es personal" on public.reports
  for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

drop policy if exists "crear reportes propios" on public.reports;
create policy "crear reportes propios" on public.reports
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "personal actualiza estado" on public.reports;
create policy "personal actualiza estado" on public.reports
  for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());
-- Sin política de delete: ningún usuario de la app puede borrar reportes.

-- El servidor decide los campos sensibles, no la app:
--  * al crear: dueño = usuario autenticado, estado = abierto, fecha = ahora
--    y la foto solo puede estar en la carpeta del propio usuario.
--  * al actualizar: el personal solo puede cambiar el estado.
--  * límite de 10 reportes por hora por usuario (evita spam).
create or replace function public.reports_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.user_id    := auth.uid();
    new.status     := 'abierto';
    new.created_at := now();
    new.updated_at := now();
    if new.photo_path is not null and split_part(new.photo_path, '/', 1) <> auth.uid()::text then
      raise exception 'La foto debe pertenecer al usuario que crea el reporte' using errcode = '42501';
    end if;
    if (select count(*) from public.reports
        where user_id = auth.uid() and created_at > now() - interval '1 hour') >= 10 then
      raise exception 'Límite de 10 reportes por hora alcanzado' using errcode = 'P0001';
    end if;
  else
    new.id          := old.id;
    new.user_id     := old.user_id;
    new.category    := old.category;
    new.location    := old.location;
    new.description := old.description;
    new.photo_path  := old.photo_path;
    new.created_at  := old.created_at;
    new.updated_at  := now();
  end if;
  return new;
end;
$$;

drop trigger if exists reports_guard on public.reports;
create trigger reports_guard
  before insert or update on public.reports
  for each row execute function public.reports_guard();

-- ---------------------------------------------------------------------------
-- 3. Almacenamiento de fotografías (bucket privado)
--    Ruta de cada foto: <id del usuario>/<id aleatorio>.jpg
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidencias', 'evidencias', false, 5242880, array['image/jpeg'])
on conflict (id) do update
  set public = false, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg'];

drop policy if exists "subir fotos a carpeta propia" on storage.objects;
create policy "subir fotos a carpeta propia" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'evidencias'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "ver fotos propias o todas si es personal" on storage.objects;
create policy "ver fotos propias o todas si es personal" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'evidencias'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff())
  );
-- Sin política de update: una evidencia subida no se puede reemplazar.
-- ERR-02: el autor solo puede borrar una foto de su carpeta que NO esté ligada a un reporte
-- (la app la borra si el registro del reporte falla después de subirla).
drop policy if exists "borrar foto propia sin reporte" on storage.objects;
create policy "borrar foto propia sin reporte" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'evidencias'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not exists (select 1 from public.reports r where r.photo_path = storage.objects.name)
  );
