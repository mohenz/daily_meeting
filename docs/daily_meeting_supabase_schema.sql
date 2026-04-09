-- Daily Meeting Memo App
-- Supabase PostgreSQL schema
-- Current phase: app-managed users with email + password

create extension if not exists pgcrypto;

do $$
begin
    if not exists (select 1 from pg_type where typname = 'meeting_type') then
        create type public.meeting_type as enum ('Daily Scrum', 'Daily Wrap-Up', 'Emergency');
    end if;
end $$;

do $$
begin
    if not exists (select 1 from pg_type where typname = 'worker_status') then
        create type public.worker_status as enum ('active', 'inactive');
    end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create table if not exists public.worker_profiles (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    password_hash text,
    role_name text,
    is_admin boolean not null default false,
    status public.worker_status not null default 'active',
    sort_order integer not null default 100,
    password_updated_at timestamptz,
    last_login_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint worker_profiles_name_check check (char_length(trim(name)) > 0),
    constraint worker_profiles_email_check check (
        email = lower(trim(email))
        and char_length(trim(email)) > 0
    ),
    constraint worker_profiles_sort_order_check check (sort_order >= 0)
);

create table if not exists public.meeting_sessions (
    id uuid primary key default gen_random_uuid(),
    meeting_date date not null,
    meeting_type public.meeting_type not null,
    emergency_seq integer not null default 0,
    title text,
    description text,
    created_by_worker_id uuid references public.worker_profiles (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint meeting_sessions_type_seq_check check (
        (meeting_type in ('Daily Scrum', 'Daily Wrap-Up') and emergency_seq = 0)
        or
        (meeting_type = 'Emergency' and emergency_seq >= 1)
    )
);

create unique index if not exists meeting_sessions_unique_date_type_seq
    on public.meeting_sessions (meeting_date, meeting_type, emergency_seq);

create table if not exists public.meeting_notes (
    id uuid primary key default gen_random_uuid(),
    meeting_session_id uuid not null references public.meeting_sessions (id) on delete cascade,
    worker_id uuid not null references public.worker_profiles (id) on delete restrict,
    completed_work text not null default '',
    in_progress_work text not null default '',
    planned_work text not null default '',
    issues text not null default '',
    created_by_worker_id uuid references public.worker_profiles (id) on delete set null,
    updated_by_worker_id uuid references public.worker_profiles (id) on delete set null,
    deleted_by_worker_id uuid references public.worker_profiles (id) on delete set null,
    deleted_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint meeting_notes_content_check check (
        char_length(completed_work) > 0
        or char_length(in_progress_work) > 0
        or char_length(planned_work) > 0
        or char_length(issues) > 0
    )
);

create unique index if not exists meeting_notes_unique_active_worker_session
    on public.meeting_notes (meeting_session_id, worker_id)
    where deleted_at is null;

create index if not exists worker_profiles_sort_order_idx
    on public.worker_profiles (sort_order asc, name asc);

create index if not exists worker_profiles_status_idx
    on public.worker_profiles (status, is_admin);

create unique index if not exists worker_profiles_email_unique_idx
    on public.worker_profiles ((lower(email)));

create index if not exists meeting_sessions_date_idx
    on public.meeting_sessions (meeting_date desc, meeting_type asc, emergency_seq asc);

create index if not exists meeting_notes_worker_idx
    on public.meeting_notes (worker_id, created_at desc)
    where deleted_at is null;

create index if not exists meeting_notes_session_idx
    on public.meeting_notes (meeting_session_id)
    where deleted_at is null;

drop trigger if exists worker_profiles_set_updated_at on public.worker_profiles;
create trigger worker_profiles_set_updated_at
before update on public.worker_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists meeting_sessions_set_updated_at on public.meeting_sessions;
create trigger meeting_sessions_set_updated_at
before update on public.meeting_sessions
for each row
execute function public.set_updated_at();

drop trigger if exists meeting_notes_set_updated_at on public.meeting_notes;
create trigger meeting_notes_set_updated_at
before update on public.meeting_notes
for each row
execute function public.set_updated_at();

comment on table public.worker_profiles is '작업자 마스터이자 현재 단계의 앱 내부 사용자 계정 테이블. 관리자 여부, 상태, 정렬순위, 비밀번호 해시를 관리한다.';
comment on table public.meeting_sessions is '날짜별 미팅 세션. Daily Scrum, Daily Wrap-Up, Emergency를 관리한다.';
comment on table public.meeting_notes is '작업자별 작업진행현황 메모. soft delete를 지원한다.';

comment on column public.worker_profiles.email is '로그인 ID로 사용하는 이메일 주소';
comment on column public.worker_profiles.password_hash is 'bcrypt 해시 비밀번호. admin이 사전 등록한 작업자는 null일 수 있으며, 가입 시 설정한다.';
comment on column public.worker_profiles.sort_order is '작업자 리스트 출력 정렬순위';
comment on column public.worker_profiles.password_updated_at is '비밀번호 최종 변경 시각';
comment on column public.worker_profiles.last_login_at is '마지막 로그인 시각';
comment on column public.meeting_sessions.emergency_seq is 'Emergency 미팅 순번. 기본 미팅은 0';
comment on column public.meeting_notes.completed_work is '진행완료작업';
comment on column public.meeting_notes.in_progress_work is '진행중인작업';
comment on column public.meeting_notes.planned_work is '진행예정인작업';
comment on column public.meeting_notes.issues is '이슈사항';

-- Optional helper:
-- 특정 날짜의 기본 미팅 2종을 자동 생성하고 싶다면 아래 함수를 사용할 수 있다.
create or replace function public.create_default_daily_meetings(
    p_meeting_date date,
    p_created_by_worker_id uuid default null
)
returns void
language plpgsql
as $$
begin
    insert into public.meeting_sessions (
        meeting_date,
        meeting_type,
        emergency_seq,
        title,
        created_by_worker_id
    )
    values
        (p_meeting_date, 'Daily Scrum', 0, 'Daily Scrum', p_created_by_worker_id),
        (p_meeting_date, 'Daily Wrap-Up', 0, 'Daily Wrap-Up', p_created_by_worker_id)
    on conflict (meeting_date, meeting_type, emergency_seq) do nothing;
end;
$$;
