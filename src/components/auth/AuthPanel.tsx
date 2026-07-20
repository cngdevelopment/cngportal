"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/admin/FormField";
import { signInAction, requestPasswordResetAction } from "@/app/actions/auth";
import type { FieldErrors, Result } from "@/lib/result";

type View = "signin" | "staff" | "forgot";

export function AuthPanel() {
  const router = useRouter();
  const [view, setView] = useState<View>("signin");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function go(next: View) {
    setErrors({});
    setBanner(null);
    setNotice(null);
    setView(next);
  }

  function handleSignIn(result: Result<null>) {
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
    startTransition(async () => handleSignIn(await signInAction({ email, password })));
  }

  function submitForgot(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setBanner(null);
    setNotice(null);
    startTransition(async () => {
      const result = await requestPasswordResetAction({ email });
      if (result.ok) {
        setNotice("If an account exists for that email, a reset link is on its way.");
      } else {
        setErrors(result.error.fields ?? {});
        setBanner(result.error.fields ? null : result.error.message);
      }
    });
  }

  const emailField = (
    <FormField label="Email" htmlFor="email" error={errors.email} required>
      <input id="email" type="email" autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
    </FormField>
  );
  const passwordField = (
    <FormField label="Password" htmlFor="password" error={errors.password} required>
      <input id="password" type="password" autoComplete="current-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
    </FormField>
  );

  if (view === "forgot") {
    return (
      <div>
        <div className="auth-section-title">Reset your password</div>
        {banner && <div className="auth-error" role="alert">{banner}</div>}
        {notice ? (
          <div className="auth-notice" role="status">{notice}</div>
        ) : (
          <form onSubmit={submitForgot} noValidate>
            {emailField}
            <button className="btn wide" type="submit" disabled={pending}>
              {pending ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
        <button type="button" className="auth-switch-link" onClick={() => go("signin")}>
          ← Back to sign in
        </button>
      </div>
    );
  }

  const isStaff = view === "staff";
  return (
    <div>
      <div className="auth-section-title">{isStaff ? "Staff sign in" : "Sign in"}</div>
      {banner && <div className="auth-error" role="alert">{banner}</div>}
      <form onSubmit={submitSignIn} noValidate>
        {emailField}
        {passwordField}
        <button className="btn wide" type="submit" disabled={pending}>
          {pending ? "Signing in…" : isStaff ? "Staff sign in" : "Sign in"}
        </button>
      </form>

      <button type="button" className="auth-switch-link" onClick={() => go("forgot")}>
        Forgot password?
      </button>
      <button type="button" className="auth-switch-link" onClick={() => go(isStaff ? "signin" : "staff")}>
        {isStaff ? "← Customer sign in" : "Staff sign in →"}
      </button>
    </div>
  );
}
