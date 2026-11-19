import type { createClient } from "@/lib/supabase/client";

type SupabaseBrowserClient = ReturnType<typeof createClient>;

export type WorkspaceMembership = {
  organization_id: string;
  role: "owner" | "admin" | "member" | "client";
  client_account_id: string | null;
};

export const ACTIVE_WORKSPACE_KEY = "sitecare-pulse:active-workspace";

export async function getWorkspaceMemberships(supabase: SupabaseBrowserClient, userId: string): Promise<WorkspaceMembership[]> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id,role,client_account_id")
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []) as WorkspaceMembership[];
}

export async function getActiveMembership(supabase: SupabaseBrowserClient, userId: string): Promise<WorkspaceMembership> {
  const memberships = await getWorkspaceMemberships(supabase, userId);
  if (memberships.length === 0) throw new Error("No workspace membership was found.");

  const savedId = typeof window !== "undefined"
    ? window.localStorage.getItem(ACTIVE_WORKSPACE_KEY)
    : null;

  const selected = savedId
    ? memberships.find((membership) => membership.organization_id === savedId)
    : null;

  if (selected) return selected;
  if (memberships.length === 1) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_WORKSPACE_KEY, memberships[0].organization_id);
    }
    return memberships[0];
  }

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
  }
  throw new Error("Choose an active workspace before continuing.");
}
