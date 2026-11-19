"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-muted transition hover:bg-slate-50 hover:text-ink disabled:opacity-60"
      aria-label="Sign out"
    >
      <LogOut size={15} />
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
