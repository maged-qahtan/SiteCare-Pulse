"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Activity, ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function makeSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 63);
}

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [pending, setPending] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function checkAccount() {
      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          router.replace("/login/");
          return;
        }
        const { data, error: membershipError } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", userData.user.id)
          .limit(1);
        if (membershipError) throw membershipError;
        if (data && data.length > 0) {
          router.replace("/");
          return;
        }
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Unable to verify your account.");
      } finally {
        if (active) setChecking(false);
      }
    }
    void checkAccount();
    return () => { active = false; };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const supabase = createClient();
      const cleanSlug = makeSlug(slug || name);
      if (cleanSlug.length < 3) throw new Error("Use at least 3 English letters or numbers for the workspace URL.");
      const createOrganization = supabase.rpc as unknown as (
        functionName: "create_organization",
        args: { org_name: string; org_slug: string }
      ) => Promise<{ error: Error | null }>;
      const { error: createError } = await createOrganization("create_organization", {
        org_name: name.trim(),
        org_slug: cleanSlug
      });
      if (createError) throw createError;
      router.replace("/");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create your workspace.");
    } finally {
      setPending(false);
    }
  }

  if (checking) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f5f7f5] text-sm text-muted"><LoaderCircle className="mr-2 animate-spin" size={18} />Checking your account...</main>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7f5] px-5 py-12">
      <section className="w-full max-w-[460px]">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white"><Activity size={22} /></div>
          <div><div className="text-lg font-bold tracking-tight text-ink">SiteCare <span className="text-brand">Pulse</span></div><div className="text-[10px] font-semibold uppercase tracking-[.16em] text-muted">Agency workspace</div></div>
        </div>
        <div className="rounded-2xl border border-line bg-white p-7 shadow-card sm:p-8">
          <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-brand"><ShieldCheck size={15} /> FIRST-TIME SETUP</div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Create your agency workspace</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Set up your agency space. You will become its owner and can add clients and teammates later.</p>
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block"><span className="mb-2 block text-xs font-semibold text-ink">Agency name</span><input required minLength={2} maxLength={120} value={name} onChange={event => { setName(event.target.value); if (!slug) setSlug(makeSlug(event.target.value)); }} className="w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-brand" placeholder="Your agency name" /></label>
            <label className="block"><span className="mb-2 block text-xs font-semibold text-ink">Workspace URL name</span><input required minLength={3} maxLength={63} pattern="[a-z0-9][a-z0-9-]{1,61}[a-z0-9]" value={slug} onChange={event => setSlug(makeSlug(event.target.value))} className="w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-brand" placeholder="your-agency" /><span className="mt-1 block text-[10px] text-muted">Lowercase English letters, numbers, and hyphens.</span></label>
            {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-700">{error}</p>}
            <button type="submit" disabled={pending || !name.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">{pending ? <LoaderCircle className="animate-spin" size={17} /> : <ArrowRight size={16} />}{pending ? "Creating workspace..." : "Create workspace"}</button>
          </form>
        </div>
        <p className="mt-5 text-center text-[10px] leading-5 text-muted">Your workspace is private to its members. Never share your password or private API keys.</p>
      </section>
    </main>
  );
}
