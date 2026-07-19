import type { ReactNode } from "react";

/**
 * Labeled form control with consistent spacing, required marker, optional
 * hint, and inline error. Wrap any input/select/textarea. Pass a stable
 * `htmlFor`/`id` so the label is properly associated (accessibility).
 */
export function FormField({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="fgroup">
      <label htmlFor={htmlFor}>
        {label}
        {required ? <span className="req"> *</span> : null}
      </label>
      {children}
      {hint && !error ? <div className="field-hint">{hint}</div> : null}
      {error ? (
        <div className="err" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
}
