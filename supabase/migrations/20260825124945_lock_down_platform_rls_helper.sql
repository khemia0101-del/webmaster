-- Supabase installs this event-trigger helper as SECURITY DEFINER. It only
-- needs to be invoked by the platform event trigger, never through PostgREST.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
