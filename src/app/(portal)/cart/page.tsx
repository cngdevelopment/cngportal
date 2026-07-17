import Link from "next/link";
import { requireCustomer } from "@/data/context";
import { listShipToAddresses } from "@/data/orders";
import { CartReview } from "@/components/cart/CartReview";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const ctx = await requireCustomer();
  const shipTo = await listShipToAddresses(ctx.accountId);

  return (
    <>
      <Link href="/new-order" className="back">
        &larr; Back to catalog
      </Link>
      <h1>Review Order</h1>
      <p className="sub">Check the lines, choose how it gets to you, and submit.</p>
      <CartReview
        shipToOptions={shipTo.map((s) => ({
          id: s.id,
          label: s.label,
          line1: s.line1,
          city: s.city,
          state: s.state,
          zip: s.zip,
          isDefault: s.isDefault,
        }))}
        warehouse={{
          address: process.env.WAREHOUSE_ADDRESS ?? "9150 Latty Ave, Berkeley, MO 63134",
          hours: process.env.WAREHOUSE_HOURS ?? "Mon–Fri 7:00 AM – 4:00 PM",
          phone: process.env.WAREHOUSE_PHONE ?? "314-838-8588",
        }}
      />
    </>
  );
}
