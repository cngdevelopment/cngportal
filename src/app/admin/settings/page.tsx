import { requirePermission } from "@/server/auth/guards";
import { getSettings } from "@/server/settings/settings";
import { PageHeader } from "@/components/admin/PageHeader";
import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { ROUTES } from "@/config/routes";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requirePermission("settings.manage");
  const settings = await getSettings();

  return (
    <>
      <Breadcrumbs items={[{ label: "Admin", href: ROUTES.admin.overview }, { label: "Settings" }]} />
      <PageHeader
        title="Settings"
        description="Company info, warehouse, and portal details. Changes apply across the site immediately."
      />
      <div className="settings-panel">
        <SettingsForm settings={settings} />
      </div>
    </>
  );
}
