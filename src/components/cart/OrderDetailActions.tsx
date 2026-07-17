"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { cancelOrderAction, getReorderLinesAction } from "@/app/actions/orders";

export function OrderDetailActions({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const { replaceAll, lines } = useCart();
  const [busy, setBusy] = useState(false);

  async function handleReorder() {
    setBusy(true);
    try {
      const reorderedLines = await getReorderLinesAction(orderId);
      replaceAll([...lines, ...reorderedLines]);
      router.push("/cart");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Cancel this order? Our team will be notified.")) return;
    setBusy(true);
    try {
      await cancelOrderAction(orderId);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
      <button className="btn ghost" disabled={busy} onClick={handleReorder}>
        Reorder
      </button>
      {status === "SUBMITTED" && (
        <button className="btn danger" disabled={busy} onClick={handleCancel}>
          Cancel Order
        </button>
      )}
    </div>
  );
}
