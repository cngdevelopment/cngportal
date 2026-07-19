"use client";

import { ErrorState } from "@/components/ErrorState";

export default function StaffError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState error={error} reset={reset} homeHref="/staff/queue" homeLabel="Back to queue" />;
}
