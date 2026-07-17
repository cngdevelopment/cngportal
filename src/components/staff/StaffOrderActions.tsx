"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  advanceOrderAction,
  sendBackOrderAction,
  holdOrderAction,
  resumeOrderAction,
  cancelOrderStaffAction,
} from "@/app/actions/staff";

type ReasonAction = "SEND_BACK" | "HOLD" | "CANCEL";

const REASON_COPY: Record<ReasonAction, { label: string; placeholder: string }> = {
  SEND_BACK: { label: "Send back one step", placeholder: "Why is this moving backward?" },
  HOLD: { label: "Put on hold", placeholder: "Why is this on hold?" },
  CANCEL: { label: "Cancel order", placeholder: "Why is this being cancelled?" },
};

export function StaffOrderActions({
  orderId,
  status,
  canAdvance,
  canSendBack,
}: {
  orderId: string;
  status: string;
  canAdvance: boolean;
  canSendBack: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<ReasonAction | null>(null);
  const [reason, setReason] = useState("");

  const isHold = status === "ON_HOLD";
  const isTerminal = status === "COMPLETED" || status === "CANCELLED";

  async function run(fn: () => Promise<{ ok: boolean }>) {
    setBusy(true);
    try {
      await fn();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function submitReason() {
    if (!reason.trim() || !pending) return;
    setBusy(true);
    try {
      if (pending === "SEND_BACK") await sendBackOrderAction(orderId, reason);
      if (pending === "HOLD") await holdOrderAction(orderId, reason);
      if (pending === "CANCEL") await cancelOrderStaffAction(orderId, reason);
      router.refresh();
      setPending(null);
      setReason("");
    } finally {
      setBusy(false);
    }
  }

  if (isTerminal) {
    return <p className="meta">This order is {status === "COMPLETED" ? "complete" : "cancelled"} — no further status changes.</p>;
  }

  return (
    <div>
      <div className="staff-actions">
        {isHold ? (
          <button className="btn" disabled={busy} onClick={() => run(() => resumeOrderAction(orderId))}>
            Resume
          </button>
        ) : (
          <>
            {canAdvance && (
              <button className="btn" disabled={busy} onClick={() => run(() => advanceOrderAction(orderId))}>
                Advance to next step
              </button>
            )}
            {canSendBack && (
              <button className="btn ghost" disabled={busy} onClick={() => setPending("SEND_BACK")}>
                Send back one step
              </button>
            )}
            <button className="btn ghost" disabled={busy} onClick={() => setPending("HOLD")}>
              Put on hold
            </button>
          </>
        )}
        <button className="btn danger" disabled={busy} onClick={() => setPending("CANCEL")}>
          Cancel order
        </button>
      </div>

      {pending && (
        <div className="reason-box">
          <div className="fgroup">
            <label>
              {REASON_COPY[pending].label} <span className="req">*</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={REASON_COPY[pending].placeholder}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn ghost" disabled={busy} onClick={() => { setPending(null); setReason(""); }}>
              Cancel
            </button>
            <button className="btn" disabled={busy || !reason.trim()} onClick={submitReason}>
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
