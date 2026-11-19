"use client";

import { FormEvent, useEffect, useState } from "react";
import { Activity, ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [isResetting, setIsResetting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const authError = new URLSearchParams(window.location.search).get("error");
    if (authError) setError(authError);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setError("");

    try {
      const supabase = createClient();

      if (isResetting) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth/callback/?next=/reset-password/`
        });
        if (resetError) throw resetError;
        setMessage("If this email belongs to an account, a password reset link has been sent.");
        return;
      }

      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback/`
          }
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          router.replace("/");
          router.refresh();
        } else {
          setMessage("Account created. Check your email for the confirmation link before signing in.");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (signInError) throw signInError;
        router.replace("/");
        router.refresh();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to complete authentication.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7f5] px-5 py-12">
      <section className="w-full max-w-[420px]">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white">
            <Activity size={22} strokeWidth={2.4} />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-ink">SiteCare <span className="text-brand">Pulse</span></div>
            <div className="text-[10px] font-semibold uppercase tracking-[.16em] text-muted">Agency workspace</div>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-7 shadow-card sm:p-8">
          <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-brand">
            <ShieldCheck size={15} /> SECURE WORKSPACE ACCESS
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {isResetting ? "Reset your password" : mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            {isResetting
              ? "Enter your account email and we will send a secure password reset link."
              : mode === "signin"
                ? "Sign in to continue to your agency workspace."
                : "Create an account to start setting up your agency workspace."}
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-ink">Email address</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-emerald-100"
                placeholder="you@company.com"
              />
            </label>
            {!isResetting && <label className="block">
              <span className="mb-2 block text-xs font-semibold text-ink">Password</span>
              <input
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-emerald-100"
                placeholder="At least 8 characters"
              />
            </label>}

            {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-700">{error}</p>}
            {message && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2.5 text-xs leading-5 text-emerald-700">{message}</p>}

            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowRight size={16} />}
              {pending ? "Please wait..." : isResetting ? "Send reset link" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          {mode === "signin" && !isResetting && <button type="button" onClick={() => { setIsResetting(true); setError(""); setMessage(""); }} className="mt-4 w-full text-center text-xs font-semibold text-brand hover:underline">Forgot password?</button>}
          <div className="mt-6 border-t border-line pt-5 text-center text-xs text-muted">
            {isResetting ? "Remembered your password?" : mode === "signin" ? "New to SiteCare Pulse?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                if (isResetting) setIsResetting(false);
                else setMode(mode === "signin" ? "signup" : "signin");
                setError("");
                setMessage("");
              }}
              className="font-bold text-brand hover:underline"
            >
              {isResetting || mode === "signup" ? "Sign in" : "Create an account"}
            </button>
          </div>
        </div>

        <p className="mt-5 text-center text-[10px] leading-5 text-muted">
          Your account is protected by Supabase Authentication. Never share your password or private API keys.
        </p>
      </section>
    </main>
  );
}
