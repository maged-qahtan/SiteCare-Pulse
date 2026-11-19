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
    let subscription: { unsubscribe: () => void } | undefined;

    async function verifySession() {
      try {
        const supabase = createClient();
        const authState = supabase.auth.onAuthStateChange((_event, session) => {
          if (!active) return;
          if (!session) {
            router.replace("/login");
          } else {
            setReady(true);
          }
        });
        subscription = authState.data.subscription;

        const { data, error } = await supabase.auth.getUser();
        if (!active) return;

        if (error || !data.user) {
          router.replace("/login");
          return;
        }

        setReady(true);
      } catch (error) {
        if (active) {
          setConfigurationError(
            error instanceof Error ? error.message : "Authentication is not configured."
          );
        }
      }
    }

    void verifySession();

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [router]);

  if (configurationError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f5] px-6">
        <div className="max-w-md rounded-2xl border border-line bg-white p-7 text-center shadow-card">
          <Activity className="mx-auto text-brand" size={28} />
          <h1 className="mt-4 text-lg font-bold text-ink">Workspace setup required</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{configurationError}</p>
          <p className="mt-3 text-xs leading-5 text-muted">Add the Supabase project URL and publishable key to the hosting environment, then rebuild the site.</p>
        </div>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f5]">
        <div className="flex items-center gap-3 text-sm font-medium text-muted">
          <LoaderCircle className="animate-spin text-brand" size={18} />
          Verifying your workspace session...
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
