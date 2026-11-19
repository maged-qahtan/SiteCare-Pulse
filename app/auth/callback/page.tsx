"use client";

import { useEffect, useState } from "react";
import { Activity, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Confirming your email address...");

  useEffect(() => {
    let active = true;

    async function completeSignIn() {
      try {
        const code = new URLSearchParams(window.location.search).get("code");
        if (!code) {
          throw new Error("The confirmation link is missing its sign-in code.");
        }

        const supabase = createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;

        if (active) {
          const next = new URLSearchParams(window.location.search).get("next");
          const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
          window.location.replace(destination);
        }
      } catch (error) {
        if (active) {
          setMessage(error instanceof Error ? error.message : "Email confirmation failed.");
        }
      }
    }

    void completeSignIn();
    return () => {
      active = false;
    };
  }, []);

  const hasError = message !== "Confirming your email address...";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7f5] px-6">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-card">
        <Activity className="mx-auto text-brand" size={30} />
        <h1 className="mt-4 text-xl font-bold text-ink">SiteCare Pulse</h1>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted">
          {!hasError && <LoaderCircle className="animate-spin" size={16} />}
          {message}
        </div>
        {hasError && <Link href="/login/" className="mt-6 inline-block text-sm font-bold text-brand hover:underline">Return to sign in</Link>}
      </div>
    </main>
  );
}
