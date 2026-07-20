import { requirePermission } from "@/server/auth/guards";
import { listEmployees } from "@/data/employees";
import { PageHeader } from "@/components/admin/PageHeader";
import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { EmployeesTable } from "@/components/admin/EmployeesTable";
import { ROUTES } from "@/config/routes";

export const dynamic = "force-dynamic";

export default async function AdminEmployeesPage() {
  await requirePermission("employees.manage");
  const employees = await listEmployees();

  return (
    <>
      <Breadcrumbs items={[{ label: "Admin", href: ROUTES.admin.overview }, { label: "Employees" }]} />
      <PageHeader
        title="Employees"
        description="Create and manage staff logins. Only admins can add, edit, or remove employees."
      />
      <div className="cust-panel">
        <EmployeesTable employees={employees} />
      </div>
    </>
  );
}
