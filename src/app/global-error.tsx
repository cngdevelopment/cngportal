"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Last-resort boundary: catches errors thrown in the root layout itself,
 * so it must render its own <html>/<body>. Everything below the root
 * layout is handled by the route-group error.tsx files instead.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="center-screen">
          <div className="state-card">
            <h1>Something went wrong</h1>
            <p>An unexpected error occurred. Please try again.</p>
            <button type="button" className="btn" onClick={reset}>
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
