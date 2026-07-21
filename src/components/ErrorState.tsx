"use client";

import { useEffect } from "react";

/**
 * Shared client error boundary UI for route-group `error.tsx` files.
 * Renders inside the existing page chrome (header/nav stay put) and
 * offers a `reset()` retry. Errors are logged now and are the seam where
 * a Sentry (or similar) capture drops in later.
 */
export function ErrorState({
  error,
  reset,
  homeHref,
  homeLabel,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref: string;
  homeLabel: string;
}) {
  useEffect(() => {
    // Observability seam - replace with Sentry.captureException(error) later.
    console.error(error);
  }, [error]);

  return (
    <div className="empty" style={{ marginTop: 20 }}>
      Something went wrong loading this page.
      {error.digest ? (
        <>
          <br />
          <span className="meta">Reference: {error.digest}</span>
        </>
      ) : null}
      <br />
      <br />
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button type="button" className="btn" onClick={reset}>
          Try again
        </button>
        <a href={homeHref} className="btn ghost">
          {homeLabel}
        </a>
      </div>
    </div>
  );
}
