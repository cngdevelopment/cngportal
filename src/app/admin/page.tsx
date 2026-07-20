import Link from "next/link";
import { requirePermission } from "@/server/auth/guards";
import { hasPermission, type Permission } from "@/server/auth/permissions";
import { getSettings } from "@/server/settings/settings";
import { PageHeader } from "@/components/admin/PageHeader";
import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { ROUTES } from "@/config/routes";

export const dynamic = "force-dynamic";

interface AdminSection {
  key: string;
  title: string;
  description: string;
  permission: Permission;
  /** Present when the section already has a live destination. */
  href?: string;
}

const SECTIONS: AdminSection[] = [
  { key: "customers", title: "Customers", permission: "accounts.manage", description: "Create customer logins and manage accounts.", href: ROUTES.admin.customers },
  { key: "settings", title: "Settings", permission: "settings.manage", description: "Company info, warehouse, branding, and announcements.", href: ROUTES.admin.settings },
  { key: "catalog", title: "Catalog", permission: "catalog.manage", description: "Products, pricing, colors, and images." },
  { key: "discounts", title: "Discounts", permission: "discounts.manage", description: "Promo codes and automatic discount rules." },
  { key: "cms", title: "Content", permission: "cms.manage", description: "Homepage, FAQs, footer, and contact info." },
  { key: "orders", title: "Orders", permission: "orders.manage", description: "Queue, status changes, and amendments.", href: ROUTES.staff.queue },
];

export default async function AdminOverview() {
  const ctx = await requirePermission("admin.access");
  const settings = await getSettings();
  const sections = SECTIONS.filter((s) => hasPermission(ctx.role, s.permission));

  return (
    <>
      <Breadcrumbs items={[{ label: "Admin" }]} />
      <PageHeader
        title="Admin"
        description={`Manage ${settings.companyName} — products, settings, discounts, and content, without touching code.`}
      />
      <div className="admin-grid">
        {sections.map((section) => (
          <div key={section.key} className="admin-card">
            <div className="admin-card-head">
              <span className="admin-card-title">{section.title}</span>
              {!section.href ? <span className="chip">Soon</span> : null}
            </div>
            <p>{section.description}</p>
            {section.href ? (
              <Link href={section.href} className="btn ghost">
                Open
              </Link>
            ) : (
              <button type="button" className="btn ghost" disabled>
                Coming soon
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
