"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { FormField } from "@/components/admin/FormField";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { updateContentAction } from "@/app/actions/content";
import type { SiteContent } from "@/server/content/content";
import type { FaqInput } from "@/schemas/content";
import type { FieldErrors } from "@/lib/result";

/** Stable ids so React keys survive reordering without remounting inputs. */
function newFaqId() {
  return `faq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function ContentForm({ content }: { content: SiteContent }) {
  const router = useRouter();
  const { toast } = useToast();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();
  const [removingFaq, setRemovingFaq] = useState<FaqInput | null>(null);

  const [form, setForm] = useState({
    welcomeHeading: content.welcomeHeading,
    welcomeBody: content.welcomeBody,
    footerText: content.footerText,
    contactEmail: content.contactEmail,
    contactPhone: content.contactPhone,
    contactAddress: content.contactAddress,
    contactHours: content.contactHours,
  });
  const [faqs, setFaqs] = useState<FaqInput[]>(content.faqs);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setFaq(id: string, patch: Partial<FaqInput>) {
    setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function addFaq() {
    setFaqs((prev) => [...prev, { id: newFaqId(), question: "", answer: "" }]);
  }

  function move(id: string, dir: -1 | 1) {
    setFaqs((prev) => {
      const i = prev.findIndex((f) => f.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = await updateContentAction({ ...form, faqs });
      if (result.ok) {
        toast("Content saved.");
        router.refresh();
      } else {
        setErrors(result.error.fields ?? {});
        toast(result.error.message, "error");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="form-section-label">Dashboard welcome</div>
      <div className="field-hint" style={{ marginBottom: 10 }}>
        Shown at the top of the customer dashboard. Leave blank to hide it.
      </div>
      <FormField label="Heading" htmlFor="welcomeHeading" error={errors.welcomeHeading}>
        <input id="welcomeHeading" className="field" value={form.welcomeHeading} onChange={(e) => set("welcomeHeading", e.target.value)} placeholder="Welcome back" />
      </FormField>
      <FormField label="Message" htmlFor="welcomeBody" error={errors.welcomeBody}>
        <textarea id="welcomeBody" className="field" rows={3} value={form.welcomeBody} onChange={(e) => set("welcomeBody", e.target.value)} placeholder="Optional message for your customers." />
      </FormField>

      <div className="form-section-label">Contact details</div>
      <div className="field-hint" style={{ marginBottom: 10 }}>
        Shown to customers on the Help page.
      </div>
      <div className="form-2col">
        <FormField label="Contact email" htmlFor="contactEmail" error={errors.contactEmail}>
          <input id="contactEmail" type="email" className="field" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
        </FormField>
        <FormField label="Contact phone" htmlFor="contactPhone" error={errors.contactPhone}>
          <input id="contactPhone" className="field" value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
        </FormField>
      </div>
      <div className="form-2col">
        <FormField label="Address" htmlFor="contactAddress" error={errors.contactAddress}>
          <input id="contactAddress" className="field" value={form.contactAddress} onChange={(e) => set("contactAddress", e.target.value)} />
        </FormField>
        <FormField label="Hours" htmlFor="contactHours" error={errors.contactHours}>
          <input id="contactHours" className="field" value={form.contactHours} onChange={(e) => set("contactHours", e.target.value)} />
        </FormField>
      </div>

      <div className="form-section-label">Footer</div>
      <FormField label="Footer text" htmlFor="footerText" error={errors.footerText} hint="Appears at the bottom of every customer page.">
        <input id="footerText" className="field" value={form.footerText} onChange={(e) => set("footerText", e.target.value)} />
      </FormField>

      <div className="form-section-label">FAQs</div>
      <div className="field-hint" style={{ marginBottom: 10 }}>
        {faqs.length === 0
          ? "No FAQs yet. The Help page will just show your contact details."
          : `${faqs.length} question${faqs.length === 1 ? "" : "s"}, shown in this order.`}
      </div>

      {faqs.map((faq, i) => (
        <div key={faq.id} className="faq-editor">
          <div className="faq-editor-head">
            <span className="faq-editor-num">{i + 1}</span>
            <div className="faq-editor-tools">
              <button type="button" className="btn ghost sm" disabled={i === 0} onClick={() => move(faq.id, -1)} aria-label="Move up">
                ↑
              </button>
              <button type="button" className="btn ghost sm" disabled={i === faqs.length - 1} onClick={() => move(faq.id, 1)} aria-label="Move down">
                ↓
              </button>
              <button type="button" className="rm" onClick={() => setRemovingFaq(faq)}>
                Delete
              </button>
            </div>
          </div>
          <input
            className="field"
            value={faq.question}
            onChange={(e) => setFaq(faq.id, { question: e.target.value })}
            placeholder="Question"
            style={{ marginBottom: 7 }}
            aria-label={`FAQ ${i + 1} question`}
          />
          <textarea
            className="field"
            rows={3}
            value={faq.answer}
            onChange={(e) => setFaq(faq.id, { answer: e.target.value })}
            placeholder="Answer"
            aria-label={`FAQ ${i + 1} answer`}
          />
        </div>
      ))}

      <button type="button" className="btn ghost" onClick={addFaq} style={{ marginBottom: 18 }}>
        + Add FAQ
      </button>

      {errors.faqs && <div className="err" style={{ marginBottom: 12 }}>{errors.faqs}</div>}

      <button className="btn wide" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save content"}
      </button>

      {removingFaq && (
        <ConfirmDialog
          title="Delete this FAQ?"
          message={
            <>
              {removingFaq.question.trim() ? <b>{removingFaq.question}</b> : "This empty question"} will
              be removed. You still need to press Save for it to take effect.
            </>
          }
          confirmLabel="Delete FAQ"
          danger
          onConfirm={() => {
            setFaqs((prev) => prev.filter((f) => f.id !== removingFaq.id));
            setRemovingFaq(null);
          }}
          onCancel={() => setRemovingFaq(null)}
        />
      )}
    </form>
  );
}
