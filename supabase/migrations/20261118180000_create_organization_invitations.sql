-- MediConnect 2.0 - Convites de integrantes
-- Migracao revisada V4.
-- Inclui consistencia de estados, bloqueios contra corridas, listagem segura
-- e validacao de autoridade do remetente no momento da aceitacao.
--
-- IMPORTANTE:
-- 1. Revisar este arquivo antes de executar no projeto remoto.
-- 2. Esta migracao pressupoe as tabelas e funcoes existentes:
--    public.organizations, public.organization_members, public.profiles,
--    private.has_org_role(uuid, text[]) e auth.uid().
-- 3. O token em texto puro deve ser gerado na Edge Function e enviado por e-mail.
--    Somente o SHA-256 hexadecimal do token deve ser enviado ao banco.
-- 4. Nao coloque a chave service_role no aplicativo.

begin;

create table if not exists public.organization_invitations (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null
        references public.organizations(id) on delete cascade,
    email text not null,
    role text not null
        check (role in ('admin', 'professional')),
    token_hash text not null unique
        check (token_hash ~ '^[0-9a-f]{64}$'),
    status text not null default 'pending'
        check (status in ('pending', 'accepted', 'expired', 'revoked')),
    invited_by uuid not null
        references public.profiles(id),
    accepted_by uuid
        references public.profiles(id),
    created_at timestamptz not null default now(),
    expires_at timestamptz not null,
    accepted_at timestamptz,
    revoked_at timestamptz,

    constraint organization_invitations_email_normalized
        check (email = lower(btrim(email))),

    constraint organization_invitations_expiration_after_creation
        check (expires_at > created_at),

    constraint organization_invitations_acceptance_consistent
        check (
            (
                status = 'accepted'
                and accepted_by is not null
                and accepted_at is not null
                and revoked_at is null
            )
            or
            (
                status <> 'accepted'
                and accepted_by is null
                and accepted_at is null
            )
        ),

    constraint organization_invitations_revocation_consistent
        check (
            (
                status = 'revoked'
                and revoked_at is not null
                and accepted_by is null
                and accepted_at is null
            )
            or
            (
                status <> 'revoked'
                and revoked_at is null
            )
        )
);

create index if not exists idx_organization_invitations_org_created
    on public.organization_invitations (organization_id, created_at desc);

create index if not exists idx_organization_invitations_email
    on public.organization_invitations (email);

create unique index if not exists idx_organization_invitations_one_pending_email
    on public.organization_invitations (organization_id, email)
    where status = 'pending';

alter table public.organization_invitations enable row level security;

-- A tabela nao e acessivel diretamente por usuarios do aplicativo.
revoke all on table public.organization_invitations
    from public, anon, authenticated;

grant select, insert, update, delete
    on table public.organization_invitations
    to service_role;

-- Cria um convite. O usuario e identificado pelo JWT (auth.uid()).
-- Proprietario pode convidar admin/professional; admin somente professional.
create or replace function public.create_organization_invitation(
    p_organization_id uuid,
    p_email text,
    p_role text,
    p_token_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_user_id uuid;
    v_email text;
    v_org_name text;
    v_invitation_id uuid;
    v_expires_at timestamptz;
    v_is_owner boolean;
    v_is_admin boolean;
begin
    v_user_id := (select auth.uid());

    if v_user_id is null then
        raise exception 'Autenticacao obrigatoria.'
            using errcode = '28000';
    end if;

    v_email := lower(btrim(coalesce(p_email, '')));

    if v_email = ''
       or length(v_email) > 320
       or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
        raise exception 'Endereco de e-mail invalido.'
            using errcode = '22023';
    end if;

    if p_role is null or p_role not in ('admin', 'professional') then
        raise exception 'Papel de convite invalido.'
            using errcode = '22023';
    end if;

    if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
        raise exception 'Hash do convite invalido.'
            using errcode = '22023';
    end if;

    select
        private.has_org_role(p_organization_id, array['owner']::text[]),
        private.has_org_role(p_organization_id, array['admin']::text[]),
        o.name
    into v_is_owner, v_is_admin, v_org_name
    from public.organizations o
    where o.id = p_organization_id
      and o.archived_at is null;

    if v_org_name is null then
        raise exception 'Clinica nao encontrada ou arquivada.'
            using errcode = 'P0002';
    end if;

    if not coalesce(v_is_owner, false)
       and not (
           coalesce(v_is_admin, false)
           and p_role = 'professional'
       ) then
        raise exception 'Voce nao tem permissao para enviar este convite.'
            using errcode = '42501';
    end if;

    -- Serializa criacoes para a mesma clinica/e-mail.
    perform pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(
            p_organization_id::text || ':' || v_email,
            0
        )
    );

    -- Nao envia convite a quem ja pertence a esta clinica.
    if exists (
        select 1
        from auth.users u
        join public.organization_members m
          on m.user_id = u.id
        where m.organization_id = p_organization_id
          and lower(btrim(coalesce(u.email, ''))) = v_email
    ) then
        raise exception 'Este usuario ja pertence a esta clinica.'
            using errcode = '23505';
    end if;

    -- Um novo convite substitui qualquer convite pendente anterior.
    update public.organization_invitations
       set status = 'revoked',
           revoked_at = now()
     where organization_id = p_organization_id
       and email = v_email
       and status = 'pending';

    v_expires_at := now() + interval '7 days';

    insert into public.organization_invitations (
        organization_id,
        email,
        role,
        token_hash,
        status,
        invited_by,
        expires_at
    )
    values (
        p_organization_id,
        v_email,
        p_role,
        p_token_hash,
        'pending',
        v_user_id,
        v_expires_at
    )
    returning id into v_invitation_id;

    return jsonb_build_object(
        'invitation_id', v_invitation_id,
        'organization_id', p_organization_id,
        'organization_name', v_org_name,
        'email', v_email,
        'role', p_role,
        'expires_at', v_expires_at
    );
end;
$function$;

-- Aceita convite para o usuario autenticado.
-- Bloqueia a linha do convite, a clinica e a associacao do remetente durante
-- a validacao, evitando alteracoes concorrentes de estado/papel no meio da
-- operacao. O e-mail precisa estar confirmado e corresponder ao destinatario.
create or replace function public.accept_organization_invitation(
    p_token_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_user_id uuid;
    v_user_email text;
    v_email_confirmed boolean;
    v_invitation public.organization_invitations%rowtype;
    v_org_name text;
    v_inviter_role text;
    v_already_member boolean;
begin
    v_user_id := (select auth.uid());

    if v_user_id is null then
        raise exception 'Autenticacao obrigatoria.'
            using errcode = '28000';
    end if;

    select
        lower(btrim(coalesce(u.email, ''))),
        (u.email_confirmed_at is not null)
    into v_user_email, v_email_confirmed
    from auth.users u
    where u.id = v_user_id;

    if v_user_email is null
       or v_user_email = ''
       or not coalesce(v_email_confirmed, false) then
        raise exception 'A conta precisa possuir um e-mail confirmado.'
            using errcode = '42501';
    end if;

    if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
        raise exception 'Token de convite invalido.'
            using errcode = '22023';
    end if;

    select *
      into v_invitation
      from public.organization_invitations i
     where i.token_hash = p_token_hash
     for update;

    if not found then
        raise exception 'Convite nao encontrado.'
            using errcode = 'P0002';
    end if;

    if v_invitation.status <> 'pending' then
        raise exception 'Este convite nao esta mais disponivel.'
            using errcode = '55000';
    end if;

    if v_invitation.expires_at <= now() then
        update public.organization_invitations
           set status = 'expired'
         where id = v_invitation.id;

        return jsonb_build_object(
            'success', false,
            'reason', 'expired'
        );
    end if;

    if v_invitation.email <> v_user_email then
        raise exception 'O e-mail da conta autenticada nao corresponde ao convite.'
            using errcode = '42501';
    end if;

    if not exists (
        select 1
        from public.profiles p
        where p.id = v_user_id
    ) then
        raise exception 'Perfil do usuario ainda nao foi criado.'
            using errcode = '23503';
    end if;

    -- Bloqueia a clinica contra arquivamento durante a aceitacao.
    select o.name
      into v_org_name
      from public.organizations o
     where o.id = v_invitation.organization_id
       and o.archived_at is null
     for share;

    if v_org_name is null then
        raise exception 'A clinica nao esta disponivel.'
            using errcode = '55000';
    end if;

    -- Bloqueia a associacao do remetente contra alteracao/remocao concorrente.
    select m.role
      into v_inviter_role
      from public.organization_members m
     where m.organization_id = v_invitation.organization_id
       and m.user_id = v_invitation.invited_by
     for share;

    if not found
       or (
           v_invitation.role = 'admin'
           and v_inviter_role <> 'owner'
       )
       or (
           v_invitation.role = 'professional'
           and v_inviter_role not in ('owner', 'admin')
       ) then
        update public.organization_invitations
           set status = 'revoked',
               revoked_at = now()
         where id = v_invitation.id;

        return jsonb_build_object(
            'success', false,
            'reason', 'inviter_no_longer_authorized'
        );
    end if;

    select exists (
        select 1
        from public.organization_members m
        where m.organization_id = v_invitation.organization_id
          and m.user_id = v_user_id
    )
    into v_already_member;

    if v_already_member then
        raise exception 'Este usuario ja pertence a esta clinica.'
            using errcode = '23505';
    end if;

    insert into public.organization_members (
        organization_id,
        user_id,
        role
    )
    values (
        v_invitation.organization_id,
        v_user_id,
        v_invitation.role
    );

    update public.organization_invitations
       set status = 'accepted',
           accepted_by = v_user_id,
           accepted_at = now()
     where id = v_invitation.id;

    return jsonb_build_object(
        'success', true,
        'organization_id', v_invitation.organization_id,
        'organization_name', v_org_name,
        'role', v_invitation.role,
        'already_member', false
    );
end;
$function$;

-- Lista convites sem expor token_hash. Proprietario ve todos os papeis;
-- administrador ve somente convites de profissionais.
create or replace function public.list_organization_invitations(
    p_organization_id uuid,
    p_status text default null,
    p_limit integer default 50
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_user_id uuid;
    v_is_owner boolean;
    v_is_admin boolean;
    v_limit integer;
    v_result jsonb;
begin
    v_user_id := (select auth.uid());

    if v_user_id is null then
        raise exception 'Autenticacao obrigatoria.'
            using errcode = '28000';
    end if;

    if p_status is not null
       and p_status not in ('pending', 'accepted', 'expired', 'revoked') then
        raise exception 'Filtro de status invalido.'
            using errcode = '22023';
    end if;

    v_limit := least(greatest(coalesce(p_limit, 50), 1), 100);

    select
        private.has_org_role(p_organization_id, array['owner']::text[]),
        private.has_org_role(p_organization_id, array['admin']::text[])
    into v_is_owner, v_is_admin;

    if not coalesce(v_is_owner, false)
       and not coalesce(v_is_admin, false) then
        raise exception 'Voce nao tem permissao para consultar convites.'
            using errcode = '42501';
    end if;

    -- Atualiza estados pendentes que ja ultrapassaram a validade.
    update public.organization_invitations
       set status = 'expired'
     where organization_id = p_organization_id
       and status = 'pending'
       and expires_at <= now();

    select coalesce(
        jsonb_agg(
            jsonb_build_object(
                'id', q.id,
                'organization_id', q.organization_id,
                'email', q.email,
                'role', q.role,
                'status', q.status,
                'invited_by', q.invited_by,
                'accepted_by', q.accepted_by,
                'created_at', q.created_at,
                'expires_at', q.expires_at,
                'accepted_at', q.accepted_at,
                'revoked_at', q.revoked_at
            )
            order by q.created_at desc
        ),
        '[]'::jsonb
    )
    into v_result
    from (
        select i.*
        from public.organization_invitations i
        where i.organization_id = p_organization_id
          and (p_status is null or i.status = p_status)
          and (
              coalesce(v_is_owner, false)
              or i.role = 'professional'
          )
        order by i.created_at desc
        limit v_limit
    ) q;

    return jsonb_build_object(
        'invitations', v_result
    );
end;
$function$;

-- Revoga convite pendente. Administradores so podem revogar convites
-- destinados a profissionais.
create or replace function public.revoke_organization_invitation(
    p_invitation_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_user_id uuid;
    v_invitation public.organization_invitations%rowtype;
    v_is_owner boolean;
    v_is_admin boolean;
begin
    v_user_id := (select auth.uid());

    if v_user_id is null then
        raise exception 'Autenticacao obrigatoria.'
            using errcode = '28000';
    end if;

    select *
      into v_invitation
      from public.organization_invitations i
     where i.id = p_invitation_id
     for update;

    if not found then
        raise exception 'Convite nao encontrado.'
            using errcode = 'P0002';
    end if;

    select
        private.has_org_role(
            v_invitation.organization_id,
            array['owner']::text[]
        ),
        private.has_org_role(
            v_invitation.organization_id,
            array['admin']::text[]
        )
    into v_is_owner, v_is_admin;

    if not coalesce(v_is_owner, false)
       and not (
           coalesce(v_is_admin, false)
           and v_invitation.role = 'professional'
       ) then
        raise exception 'Voce nao tem permissao para revogar este convite.'
            using errcode = '42501';
    end if;

    if v_invitation.status <> 'pending' then
        return false;
    end if;

    if v_invitation.expires_at <= now() then
        update public.organization_invitations
           set status = 'expired'
         where id = v_invitation.id;

        return false;
    end if;

    update public.organization_invitations
       set status = 'revoked',
           revoked_at = now()
     where id = v_invitation.id;

    return true;
end;
$function$;

-- Remove EXECUTE implicito de PUBLIC/anon e libera somente authenticated.
revoke all on function public.create_organization_invitation(uuid, text, text, text)
    from public, anon;
revoke all on function public.accept_organization_invitation(text)
    from public, anon;
revoke all on function public.list_organization_invitations(uuid, text, integer)
    from public, anon;
revoke all on function public.revoke_organization_invitation(uuid)
    from public, anon;

grant execute on function public.create_organization_invitation(uuid, text, text, text)
    to authenticated;
grant execute on function public.accept_organization_invitation(text)
    to authenticated;
grant execute on function public.list_organization_invitations(uuid, text, integer)
    to authenticated;
grant execute on function public.revoke_organization_invitation(uuid)
    to authenticated;

comment on table public.organization_invitations is
    'Convites de integrantes do MediConnect. Tokens em texto puro nunca sao armazenados.';

commit;
