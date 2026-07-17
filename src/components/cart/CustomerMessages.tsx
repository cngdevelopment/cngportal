"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addCustomerMessageAction } from "@/app/actions/orders";

export interface MessageItem {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export function CustomerMessages({ orderId, messages }: { orderId: string; messages: MessageItem[] }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!body.trim()) return;
    setSending(true);
    try {
      await addCustomerMessageAction(orderId, body);
      setBody("");
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <h2>Messages</h2>
      <div className="msg-thread">
        {messages.length === 0 && <div className="meta">No messages yet.</div>}
        {messages.map((m) => (
          <div key={m.id} className="msg">
            <span className="who">
              {m.authorName}
              <span className="when">{m.createdAt}</span>
            </span>
            {m.body}
          </div>
        ))}
      </div>
      <div className="fgroup">
        <textarea
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Ask a question about this order"
        />
      </div>
      <button className="btn ghost" disabled={sending || !body.trim()} onClick={send}>
        {sending ? "Sending…" : "Send message"}
      </button>
    </>
  );
}
