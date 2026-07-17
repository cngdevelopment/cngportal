"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addMessageAction } from "@/app/actions/staff";

export interface StaffMessageItem {
  id: string;
  authorName: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
}

export function StaffMessages({ orderId, messages }: { orderId: string; messages: StaffMessageItem[] }) {
  const router = useRouter();
  const [customerBody, setCustomerBody] = useState("");
  const [internalBody, setInternalBody] = useState("");
  const [sending, setSending] = useState(false);

  async function send(body: string, isInternal: boolean, clear: () => void) {
    if (!body.trim()) return;
    setSending(true);
    try {
      await addMessageAction(orderId, body, isInternal);
      clear();
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <h2>Activity &amp; messages</h2>
      <div className="msg-thread">
        {messages.length === 0 && <div className="meta">Nothing yet.</div>}
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.isInternal ? "internal" : ""}`}>
            <span className="who">
              {m.authorName}
              {m.isInternal ? " · internal note" : " · to customer"}
              <span className="when">{m.createdAt}</span>
            </span>
            {m.body}
          </div>
        ))}
      </div>

      <div className="cart-cols" style={{ marginTop: 14 }}>
        <div className="cart-main side-box">
          <div className="fgroup" style={{ marginTop: 0 }}>
            <label>Message to customer</label>
            <textarea
              rows={2}
              value={customerBody}
              onChange={(e) => setCustomerBody(e.target.value)}
              placeholder="Visible to the customer on their order page"
            />
          </div>
          <button
            className="btn ghost"
            disabled={sending || !customerBody.trim()}
            onClick={() => send(customerBody, false, () => setCustomerBody(""))}
          >
            Send to customer
          </button>
        </div>
        <div className="cart-side side-box">
          <div className="fgroup" style={{ marginTop: 0 }}>
            <label>Internal note</label>
            <textarea
              rows={2}
              value={internalBody}
              onChange={(e) => setInternalBody(e.target.value)}
              placeholder="Staff only — never shown to the customer"
            />
          </div>
          <button
            className="btn ghost"
            disabled={sending || !internalBody.trim()}
            onClick={() => send(internalBody, true, () => setInternalBody(""))}
          >
            Add internal note
          </button>
        </div>
      </div>
    </>
  );
}
