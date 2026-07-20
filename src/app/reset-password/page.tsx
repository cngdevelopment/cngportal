"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { FormField } from "@/components/admin/FormField";
import { passwordResetSchema } from "@/schemas/auth";
import type { FieldErrors } from "@/lib/result";

type Status = "checking" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // The recovery link lands here with a session in the URL. @supabase/ssr
  // parses it automatically; we just wait for a valid session to appear.
  useEffect(() => {
    const supabase = supabaseBrowser();
    let settled = false;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) {
        settled = true;
        setStatus("ready");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        settled = true;
        setStatus("ready");
      } else {
        // Give the URL-token handshake a moment before giving up.
        setTimeout(() => {
          if (!settled) setStatus((s) => (s === "checking" ? "invalid" : s));
        }, 1500);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setBanner(null);
    const parsed = passwordResetSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      const f: FieldErrors = {};
      for (const issue of parsed.error.issues) f[issue.path.join(".") || "_"] = issue.message;
      setErrors(f);
      return;
    }
    setPending(true);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (error) {
      setBanner(error.message);
      return;
    }
    setStatus("done");
  }

  return (
    <div className="login-wrap">
      <div className="auth-card">
        <div className="auth-head">
          <div className="auth-brand">Reset password</div>
        </div>
        <div className="auth-body">
          {status === "checking" && <p className="auth-foot">Checking your reset link…</p>}

          {status === "invalid" && (
            <>
              <div className="auth-error" role="alert">
                This reset link is invalid or has expired. Request a new one from the sign-in page.
              </div>
              <button type="button" className="auth-switch-link" onClick={() => router.push("/login")}>
                ← Back to sign in
              </button>
            </>
          )}

          {status === "ready" && (
            <>
              {banner && <div className="auth-error" role="alert">{banner}</div>}
              <form onSubmit={onSubmit} noValidate>
                <FormField
                  label="New password"
                  htmlFor="password"
                  error={errors.password}
                  hint="At least 8 characters, with uppercase, lowercase, a number, and a special character."
                  required
                >
                  <input id="password" type="password" autoComplete="new-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
                </FormField>
                <FormField label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword} required>
                  <input id="confirmPassword" type="password" autoComplete="new-password" className="field" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </FormField>
                <button className="btn wide" type="submit" disabled={pending}>
                  {pending ? "Saving…" : "Set new password"}
                </button>
              </form>
            </>
          )}

          {status === "done" && (
            <>
              <div className="auth-notice" role="status">Your password has been updated. You can sign in now.</div>
              <button type="button" className="btn wide" onClick={() => router.push("/login")}>
                Go to sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
