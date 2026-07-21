import { requirePermission } from "@/server/auth/guards";
import { getContent } from "@/server/content/content";
import { PageHeader } from "@/components/admin/PageHeader";
import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { ContentForm } from "@/components/admin/ContentForm";
import { ROUTES } from "@/config/routes";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  await requirePermission("cms.manage");
  const content = await getContent();

  return (
    <>
      <Breadcrumbs items={[{ label: "Admin", href: ROUTES.admin.overview }, { label: "Content" }]} />
      <PageHeader
        title="Content"
        description="The words customers read — dashboard welcome, Help page FAQs, contact details, and footer."
      />
      <div className="cust-panel" style={{ maxWidth: 760 }}>
        <ContentForm content={content} />
      </div>
    </>
  );
}
