-- Finding 6 — tighten over-broad EXECUTE grants on SECURITY DEFINER functions.
--
-- Context verified against the live database before writing this migration:
--
--   generate_project_invoice()      RETURNS trigger, attached to 1 trigger
--   notify_client_review()          RETURNS trigger, attached to 1 trigger
--   notify_developer_application()  RETURNS trigger, attached to 1 trigger
--   project_is_payment_locked(uuid) RETURNS boolean, attached to 0 triggers
--
-- Trigger functions can only be invoked by the trigger machinery, so the RPC
-- grants on the first three are unnecessary attack surface rather than a live
-- exploit. Revoking them does not affect trigger execution, which runs as the
-- table owner and does not consult these grants.
--
-- An earlier migration revoked notify_client_review from anon/PUBLIC but missed
-- that Supabase grants `authenticated` its own default EXECUTE privilege, so
-- the previous fix did not fully take. This revokes all three roles explicitly.

REVOKE EXECUTE ON FUNCTION public.generate_project_invoice()
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.notify_client_review()
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.notify_developer_application()
  FROM PUBLIC, anon, authenticated;

-- project_is_payment_locked(uuid) is the one with a real cross-tenant leak:
-- it is SECURITY DEFINER (bypasses RLS) and accepts an arbitrary project_id,
-- so any signed-in user could probe another client's payment status.
--
-- This migration revokes the RPC grant rather than switching the function to
-- SECURITY INVOKER. Reasons, all verified against the live database:
--
--   1. Nothing in the application calls this function over RPC. The only
--      occurrence in src/ is the generated type in
--      src/integrations/supabase/types.ts, not a call site.
--   2. Its three real callers -- guard_discount_no_refund,
--      redeem_referral_code and apply_referral_reward_on_project -- are all
--      themselves SECURITY DEFINER and keep working unchanged, because they
--      execute as the function owner, which holds its own EXECUTE grant.
--   3. RLS on public.payments currently has SELECT policies for admins
--      ("Admin payments all") and for the owning client ("Client view own
--      payments"), but NO policy covering an assigned developer. Under
--      SECURITY INVOKER the function would therefore silently return false
--      for developers on projects they are legitimately assigned to, and any
--      payment-lock business rule evaluated in a developer's context would
--      quietly stop enforcing. Revoking removes the attack surface outright
--      without making correctness depend on that policy gap.
--
-- If this function is ever needed from the client, add a caller-scoped
-- wrapper that derives the project from auth.uid() instead of re-granting.

REVOKE EXECUTE ON FUNCTION public.project_is_payment_locked(uuid)
  FROM PUBLIC, anon, authenticated;

-- Deliberately NOT touched: has_role() and current_user_is_admin().
-- Several "public can read this" RLS policies call them directly, so revoking
-- their anon/authenticated grants would break public pages for every visitor.
