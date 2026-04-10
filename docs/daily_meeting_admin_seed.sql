-- Daily Meeting Memo App
-- Initial admin and sample worker seed for app-managed email + password auth
-- Replace the sample values before execution.

create extension if not exists pgcrypto;

do $$
declare
    v_name text := '초기 관리자';
    v_email text := lower(trim('xzeus@shinsegae.com'));
    v_password text := '123456';
begin
    if exists (
        select 1
        from public.worker_profiles
        where lower(email) = v_email
    ) then
        update public.worker_profiles
        set
            name = v_name,
            email = v_email,
            password_hash = crypt(v_password, gen_salt('bf', 10)),
            role_name = coalesce(role_name, 'Platform Admin'),
            is_admin = true,
            status = 'active',
            sort_order = 0,
            password_updated_at = now(),
            updated_at = now()
        where lower(email) = v_email;
    else
        insert into public.worker_profiles (
            name,
            email,
            password_hash,
            role_name,
            is_admin,
            status,
            sort_order,
            password_updated_at
        )
        values (
            v_name,
            v_email,
            crypt(v_password, gen_salt('bf', 10)),
            'Platform Admin',
            true,
            'active',
            0,
            now()
        );
    end if;
end $$;

do $$
declare
    v_name text := '임소연';
    v_email text := lower(trim('soyeon.lim@example.com'));
begin
    if exists (
        select 1
        from public.worker_profiles
        where lower(email) = v_email
    ) then
        update public.worker_profiles
        set
            name = v_name,
            email = v_email,
            role_name = null,
            is_admin = false,
            status = 'active',
            sort_order = 10,
            updated_at = now()
        where lower(email) = v_email;
    else
        insert into public.worker_profiles (
            name,
            email,
            role_name,
            is_admin,
            status,
            sort_order
        )
        values (
            v_name,
            v_email,
            null,
            false,
            'active',
            10
        );
    end if;
end $$;
