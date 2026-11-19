"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Activity, LoaderCircle, Building2, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ACTIVE_WORKSPACE_KEY, getWorkspaceMemberships, type WorkspaceMembership } from "@/lib/supabase/workspace";

type WorkspaceOption = WorkspaceMembership & { name: string };

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [configurationError, setConfigurationError] = useState("");
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [activeId, setActiveId] = useState("");
  const [switching, setSwitching] = useState(false);

  const changeWorkspace = useCallback((organizationId: string) => {
    if (!workspaces.some((workspace) => workspace.organization_id === organizationId)) return;
    window.localStorage.setItem(ACTIVE_WORKSPACE_KEY, organizationId);
    setActiveId(organizationId);
    setSwitching(true);
    window.location.reload();
  }, [workspaces]);

  useEffect(() => {
    let active = true;
    let authSubscription: { unsubscribe: () => void } | undefined;

    async function verifyWorkspace() {
      try {
        const supabase = createClient();
        const listener = supabase.auth.onAuthStateChange((_event, session) => {
          if (!active) return;
          if (!session) router.replace("/login/");
        });
        authSubscription = listener.data.subscription;
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          router.replace("/login/");
          return;
        }

        const memberships = await getWorkspaceMemberships(supabase, userData.user.id);
        if (!active) return;
        if (memberships.length === 0) {
          router.replace("/setup/");
          return;
        }

        const ids = memberships.map((membership) => membership.organization_id);
        const { data: organizations, error: organizationError } = await supabase
          .from("organizations")
          .select("id,name")
          .in("id", ids);
        if (organizationError) throw organizationError;
        const names = new Map((organizations ?? []).map((organization: { id: string; name: string }) => [organization.id, organization.name]));
        const options = memberships.map((membership) => ({
          ...membership,
          name: names.get(membership.organization_id) ?? "Agency workspace"
        }));
        const savedId = window.localStorage.getItem(ACTIVE_WORKSPACE_KEY);
        const validSaved = savedId && options.some((workspace) => workspace.organization_id === savedId);
        const selectedId = validSaved ? savedId : options.length === 1 ? options[0].organization_id : "";
        if (selectedId) window.localStorage.setItem(ACTIVE_WORKSPACE_KEY, selectedId);
        else window.localStorage.removeItem(ACTIVE_WORKSPACE_KEY);

        setWorkspaces(options);
        setActiveId(selectedId);
        setReady(true);
      } catch (error) {
        if (active) {
          setConfigurationError(error instanceof Error ? error.message : "Unable to verify workspace access.");
        }
      }
    }

    void verifyWorkspace();
    return () => {
      active = false;
      authSubscription?.unsubscribe();
    };
  }, [router]);

  if (configurationError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f5] px-6">
        <div className="max-w-md rounded-2xl border border-line bg-white p-7 text-center shadow-card">
          <Activity className="mx-auto text-brand" size={28} />
          <h1 className="mt-4 text-lg font-bold text-ink">Workspace setup required</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{configurationError}</p>
          <p className="mt-3 text-xs leading-5 text-muted">Check the Supabase project URL, publishable key, and database permissions in the hosting environment.</p>
        </div>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f5]">
        <div className="flex items-center gap-3 text-sm font-medium text-muted">
          <LoaderCircle className="animate-spin text-brand" size={18} />
          Verifying your workspace...
        </div>
      </main>
    );
  }

  if (workspaces.length > 1 && !activeId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f5] px-5 py-10">
        <section className="w-full max-w-lg rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white"><Building2 size={22} /></div>
          <h1 className="mt-5 text-xl font-bold text-ink">Choose your workspace</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Your account belongs to more than one workspace. Select the company whose data you want to open.</p>
          <div className="mt-6 space-y-2">
            {workspaces.map((workspace) => (
              <button key={workspace.organization_id} type="button" disabled={switching} onClick={() => changeWorkspace(workspace.organization_id)} className="flex w-full items-center justify-between rounded-xl border border-line px-4 py-4 text-left transition hover:border-brand hover:bg-[#f5f8f6] disabled:opacity-60">
                <span><span className="block text-sm font-bold text-ink">{workspace.name}</span><span className="mt-1 block text-xs capitalize text-muted">{workspace.role} access</span></span>
                <ChevronDown className="-rotate-90 text-muted" size={17} />
              </button>
            ))}
          </div>
          <button type="button" onClick={() => void createClient().auth.signOut().then(() => router.replace("/login/"))} className="mt-5 text-xs font-semibold text-muted hover:text-brand">Sign out</button>
        </section>
      </main>
    );
  }

  const activeWorkspace = workspaces.find((workspace) => workspace.organization_id === activeId);

  return (
    <>
      {workspaces.length > 1 && activeWorkspace && (
        <div className="fixed right-3 top-3 z-50 sm:right-5 sm:top-4">
          <label className="flex items-center gap-2 rounded-xl border border-line bg-white/95 px-3 py-2 text-[11px] font-semibold text-ink shadow-card backdrop-blur">
            <Building2 size={14} className="shrink-0 text-brand" />
            <span className="hidden sm:inline">Workspace</span>
            <select aria-label="Active workspace" value={activeId} onChange={(event) => changeWorkspace(event.target.value)} className="max-w-[145px] bg-transparent text-[11px] font-bold outline-none sm:max-w-[210px]">
              {workspaces.map((workspace) => <option key={workspace.organization_id} value={workspace.organization_id}>{workspace.name}</option>)}
            </select>
          </label>
        </div>
      )}
      {children}
    </>
  );
}
