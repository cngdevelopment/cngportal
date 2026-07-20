"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/admin/FormField";
import { signInAction, signUpAction } from "@/app/actions/auth";
import type { FieldErrors, Result } from "@/lib/result";

type View = "signin" | "signup" | "staff";

export function AuthPanel() {
  const router = useRouter();
  const [view, setView] = useState<View>("signin");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");

  function go(next: View) {
    setErrors({});
    setBanner(null);
    setView(next);
  }

  function handle(result: Result<null>) {
    if (result.ok) {
      router.push("/");
      router.refresh();
    } else {
      setErrors(result.error.fields ?? {});
      setBanner(result.error.fields ? null : result.error.message);
    }
  }

  function submitSignIn(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setBanner(null);
    startTransition(async () => handle(await signInAction({ email, password })));
  }

  function submitSignUp(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setBanner(null);
    startTransition(async () => handle(await signUpAction({ companyName, fullName, email, password })));
  }

  const emailField = (
    <FormField label="Email" htmlFor="email" error={errors.email} required>
      <input id="email" type="email" autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
    </FormField>
  );
  const passwordField = (autoComplete: string) => (
    <FormField label="Password" htmlFor="password" error={errors.password} required>
      <input id="password" type="password" autoComplete={autoComplete} className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
    </FormField>
  );

  if (view === "staff") {
    return (
      <div>
        <div className="auth-section-title">Staff sign in</div>
        {banner && <div className="auth-error" role="alert">{banner}</div>}
        <form onSubmit={submitSignIn} noValidate>
          {emailField}
          {passwordField("current-password")}
          <button className="btn wide" type="submit" disabled={pending}>
            {pending ? "Signing in…" : "Staff sign in"}
          </button>
        </form>
        <button type="button" className="auth-switch-link" onClick={() => go("signin")}>
          ← Customer sign in
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="auth-tabs" role="tablist">
        <button type="button" role="tab" className={view === "signin" ? "on" : ""} onClick={() => go("signin")}>
          Sign in
        </button>
        <button type="button" role="tab" className={view === "signup" ? "on" : ""} onClick={() => go("signup")}>
          Create account
        </button>
      </div>

      {banner && <div className="auth-error" role="alert">{banner}</div>}

      {view === "signin" ? (
        <form onSubmit={submitSignIn} noValidate>
          {emailField}
          {passwordField("current-password")}
          <button className="btn wide" type="submit" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      ) : (
        <form onSubmit={submitSignUp} noValidate>
          <FormField label="Company name" htmlFor="companyName" error={errors.companyName} required>
            <input id="companyName" className="field" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </FormField>
          <FormField label="Your name" htmlFor="fullName" error={errors.fullName} required>
            <input id="fullName" className="field" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </FormField>
          {emailField}
          {passwordField("new-password")}
          <button className="btn wide" type="submit" disabled={pending}>
            {pending ? "Creating account…" : "Create account"}
          </button>
        </form>
      )}

      <button type="button" className="auth-switch-link" onClick={() => go("staff")}>
        Staff sign in →
      </button>
    </div>
  );
}
