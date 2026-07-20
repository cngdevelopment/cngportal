"use client";

import type { ReactNode } from "react";

/**
 * Reusable confirmation modal (reuses the app's .modal styling). Controlled
 * by the parent: render it only when open.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  pending = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="modal-wrap" onClick={() => !pending && onCancel()}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="actions">
          <button type="button" className="btn ghost" disabled={pending} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={danger ? "btn danger" : "btn"} disabled={pending} onClick={onConfirm}>
            {pending ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
