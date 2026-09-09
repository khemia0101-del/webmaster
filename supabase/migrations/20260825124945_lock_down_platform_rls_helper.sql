-- Some hosted Supabase projects install this SECURITY DEFINER helper; fresh
-- local stacks may not. Preserve the cloud restriction without blocking a
-- clean database bootstrap where the platform function does not exist.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$$;

