import { requireStaff } from "@/data/context";
import { listAllOrders } from "@/data/staff";
import { StaffQueueTable } from "@/components/staff/StaffQueueTable";

export const dynamic = "force-dynamic";

export default async function StaffQueuePage() {
  await requireStaff();
  const orders = await listAllOrders();

  return (
    <>
      <h1>Order Queue</h1>
      <p className="sub">Every account&rsquo;s orders, newest first.</p>
      <StaffQueueTable
        orders={orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          accountName: o.accountName,
          poNumber: o.poNumber,
          status: o.status,
          requiresAssembly: o.requiresAssembly,
          deliveryMethod: o.deliveryMethod,
          submittedAt: o.submittedAt
            ? new Date(o.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : null,
          itemCount: o._count.items,
        }))}
      />
    </>
  );
}
