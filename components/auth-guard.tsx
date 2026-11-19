"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Activity, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [configurationError, setConfigurationError] = useState("");

  useEffect(() => {
    let active = true;
    let authListener: ReturnType<ReturnType<typeof createClient>["auth"]["onAuthStateChange"]> | undefined;

    async function verifyWorkspace() {
      try {
        const supabase = createClient();
        const listener = supabase.auth.onAuthStateChange((_event, session) => {
          if (!active) return;
          if (!session) router.replace("/login/");
        });
        authListener = listener.data;
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          router.replace("/login/");
          return;
        }

        const { data: memberships, error: membershipError } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", userData.user.id)
          .limit(1);

        if (membershipError) throw membershipError;
        if (!active) return;

        if (!memberships || memberships.length === 0) {
          router.replace("/setup/");
          return;
        }

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
      authListener?.subscription.unsubscribe();
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

  return <>{children}</>;
}
