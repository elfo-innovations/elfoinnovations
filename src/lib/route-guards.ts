import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "client" | "developer";

function dashboardRootFor(role: AppRole | undefined) {
  if (role === "admin") return "/admin" as const;
  if (role === "developer") return "/developer" as const;
  if (role === "client") return "/client" as const;
  return "/auth" as const;
}

/**
 * Returns a `beforeLoad` handler for TanStack Router that requires the
 * visitor to be signed in with one of `allowedRoles`, redirecting to
 * `/auth` if signed out, or to their own dashboard root if signed in with
 * a different role. This is a second layer of defense on top of Postgres
 * RLS (see Finding 11) — RLS remains the real, always-on data boundary.
 *
 * Important: this app's Supabase session lives only in the browser's
 * localStorage (see src/integrations/supabase/client.ts) — nothing carries
 * it to the server (no cookie, no header on a plain page GET; compare
 * src/integrations/supabase/auth-middleware.ts, which requires an explicit
 * Authorization header and only exists for server-function calls, not page
 * loads). So during SSR — a hard refresh or a direct/bookmarked link — the
 * server cannot know who the visitor is, and calling
 * supabase.auth.getSession() there always reports signed-out. Enforcing a
 * redirect at that point would bounce every legitimately signed-in user on
 * their first load of any dashboard page, which is worse than the gap this
 * guard exists to close. This guard is therefore a no-op during SSR and
 * enforces only in the browser, where the session is actually known — that
 * covers same-session, in-app navigation (sidebar links, tab switches),
 * which is the vast majority of dashboard traffic, and gives a clean
 * redirect there instead of a confusing empty/error state.
 */
export function requireRole(allowedRoles: AppRole[]) {
  return async () => {
    if (typeof window === "undefined") return;

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) {
      throw redirect({ to: "/auth" });
    }

    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);
    const roles = (roleRows ?? []).map((r) => r.role as AppRole);

    if (roles.some((r) => allowedRoles.includes(r))) return;

    throw redirect({ to: dashboardRootFor(roles[0]) });
  };
}
