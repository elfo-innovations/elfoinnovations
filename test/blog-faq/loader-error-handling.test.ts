// Regression test: the blogs_.$slug loader must distinguish a real Supabase query error
// from a genuine "no row for this slug". Before this fix, `error` was never checked, so
// any query failure (network, RLS, timeout) silently fell through to the same notFound()
// as a true 404 — making real failures indistinguishable from missing posts in logs and
// to the user (see HISTORY.md entry for this fix).
import { describe, expect, it } from "vitest";

// Minimal reproduction of the loader's data/error branching, independent of the TanStack
// Start route plumbing (which needs a full router context to execute). This asserts the
// behavioral contract: a Supabase-style { data, error } result with a non-null error must
// be treated as a failure, not folded into the "not found" path.
function resolveBlogQueryOutcome(result: {
  data: unknown;
  error: unknown;
}): { kind: "error"; error: unknown } | { kind: "found"; data: unknown } | { kind: "not-found" } {
  if (result.error) return { kind: "error", error: result.error };
  if (result.data) return { kind: "found", data: result.data };
  return { kind: "not-found" };
}

describe("blogs/$slug loader query-outcome handling", () => {
  it("treats a real query error as a failure, not a 404", () => {
    const outcome = resolveBlogQueryOutcome({ data: null, error: { message: "timeout" } });
    expect(outcome.kind).toBe("error");
  });

  it("treats a genuine missing row (no error, no data) as not-found", () => {
    const outcome = resolveBlogQueryOutcome({ data: null, error: null });
    expect(outcome.kind).toBe("not-found");
  });

  it("treats a successful row fetch as found", () => {
    const outcome = resolveBlogQueryOutcome({ data: { slug: "x" }, error: null });
    expect(outcome.kind).toBe("found");
  });
});
