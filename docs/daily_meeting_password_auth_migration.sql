-- Daily Meeting Memo App
-- Migration: move from Supabase Auth / anonymous PoC to app-managed email + password auth
-- Apply this after daily_meeting_supabase_schema.sql if the tables already exist.

create extension if not exists pgcrypto;

alter table public.worker_profiles
    add column if not exists email text;

alter table public.worker_profiles
    add column if not exists password_hash text;

alter table public.worker_profiles
    add column if not exists password_updated_at timestamptz;

alter table public.worker_profiles
    add column if not exists last_login_at timestamptz;

update public.worker_profiles
set email = lower(trim(email))
where email is not null;

do $$
begin
    if exists (
        select 1
        from public.worker_profiles
        where email is null
           or char_length(trim(email)) = 0
    ) then
        raise exception 'EXISTING_WORKER_EMAIL_REQUIRED';
    end if;
end $$;

do $$
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'worker_profiles'
          and column_name = 'auth_user_id'
    ) then
        alter table public.worker_profiles
            drop column auth_user_id;
    end if;
end $$;

do $$
begin
    if exists (
        select 1
        from pg_constraint
        where conname = 'worker_profiles_email_check'
    ) then
        alter table public.worker_profiles
            drop constraint worker_profiles_email_check;
    end if;
end $$;

alter table public.worker_profiles
    add constraint worker_profiles_email_check
    check (
        email = lower(trim(email))
        and char_length(trim(email)) > 0
    );

alter table public.worker_profiles
    alter column email set not null;

create unique index if not exists worker_profiles_email_unique_idx
    on public.worker_profiles ((lower(email)));

comment on column public.worker_profiles.email is '로그인 ID로 사용하는 이메일 주소';
comment on column public.worker_profiles.password_hash is 'bcrypt 해시 비밀번호. admin이 사전 등록한 작업자는 null일 수 있으며, 가입 시 설정한다.';
comment on column public.worker_profiles.password_updated_at is '비밀번호 최종 변경 시각';
comment on column public.worker_profiles.last_login_at is '마지막 로그인 시각';

drop trigger if exists meeting_notes_set_audit_fields on public.meeting_notes;

drop policy if exists "authenticated users can view active worker profiles" on public.worker_profiles;
drop policy if exists "admins can view all worker profiles" on public.worker_profiles;
drop policy if exists "admins can insert worker profiles" on public.worker_profiles;
drop policy if exists "admins can update worker profiles" on public.worker_profiles;
drop policy if exists "authenticated users can view meeting sessions" on public.meeting_sessions;
drop policy if exists "admins can insert meeting sessions" on public.meeting_sessions;
drop policy if exists "admins can update meeting sessions" on public.meeting_sessions;
drop policy if exists "admins can delete meeting sessions" on public.meeting_sessions;
drop policy if exists "authenticated users can view active meeting notes" on public.meeting_notes;
drop policy if exists "workers can insert own meeting notes" on public.meeting_notes;
drop policy if exists "workers can update own meeting notes" on public.meeting_notes;
drop policy if exists "admins can insert meeting notes" on public.meeting_notes;
drop policy if exists "admins can update meeting notes" on public.meeting_notes;
drop policy if exists "admins can delete meeting notes" on public.meeting_notes;

alter table public.worker_profiles disable row level security;
alter table public.meeting_sessions disable row level security;
alter table public.meeting_notes disable row level security;

drop function if exists public.register_worker_profile(text, text);
drop function if exists public.current_worker_profile_id();
drop function if exists public.is_current_user_admin();
drop function if exists public.set_meeting_note_audit_fields();
