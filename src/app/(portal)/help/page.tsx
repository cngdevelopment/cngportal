import { requireCustomer } from "@/data/context";
import { getContent } from "@/server/content/content";
import { getSettings } from "@/server/settings/settings";
export const dynamic = "force-dynamic";

export default async function HelpPage() {
  await requireCustomer();
  const settings = await getSettings();
  const content = await getContent();

  const contactRows = [
    { label: "Phone", value: settings.supportPhone },
    { label: "Email", value: content.contactEmail },
    { label: "Address", value: content.contactAddress },
    { label: "Hours", value: content.contactHours },
  ].filter((r) => r.value.trim());

  return (
    <>
      <h1>Help</h1>
      <p className="sub">Answers to common questions, and how to reach us.</p>

      {content.faqs.length > 0 && (
        <>
          <h2>Frequently asked</h2>
          <div className="faq-list">
            {content.faqs.map((faq) => (
              <details key={faq.id} className="faq-item">
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </>
      )}

      {contactRows.length > 0 && (
        <>
          <h2>Contact us</h2>
          <div className="order-card">
            {contactRows.map((r) => (
              <div key={r.label} className="contact-row">
                <span className="contact-label">{r.label}</span>
                <span>{r.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
