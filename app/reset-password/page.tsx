"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, LoaderCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checking, setChecking] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    async function verifyRecoverySession() {
      try {
        const supabase = createClient();
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError || !data.user) {
          router.replace("/login/");
          return;
        }
      } catch {
        router.replace("/login/");
        return;
      } finally {
        if (active) setChecking(false);
      }
    }
    void verifyRecoverySession();
    return () => { active = false; };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    setPending(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update your password.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7f5] px-5 py-12">
      <section className="w-full max-w-[420px] rounded-2xl border border-line bg-white p-7 shadow-card sm:p-8">
        <Activity className="mx-auto text-brand" size={30} />
        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-brand"><ShieldCheck size={15} /> SECURE PASSWORD UPDATE</div>
        <h1 className="mt-4 text-center text-2xl font-bold text-ink">Choose a new password</h1>
        {checking ? <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted"><LoaderCircle className="animate-spin" size={17} />Checking reset link...</div> : done ? (
          <div className="mt-6 text-center">
            <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">Your password has been updated successfully.</p>
            <Link href="/login/" className="mt-5 inline-flex rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white">Return to sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block"><span className="mb-2 block text-xs font-semibold text-ink">New password</span><input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-brand" /></label>
            <label className="block"><span className="mb-2 block text-xs font-semibold text-ink">Confirm new password</span><input type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-brand" /></label>
            {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-xs text-rose-700">{error}</p>}
            <button type="submit" disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{pending ? <LoaderCircle size={16} className="animate-spin" /> : null}{pending ? "Updating..." : "Update password"}</button>
          </form>
        )}
      </section>
    </main>
  );
}
